# mcp_server.py
# MCP Server (Model Context Protocol) for ElevenLabs voice agent
# Supports both SSE and Streamable HTTP transports
# Run with: uvicorn mcp_server:app --host 0.0.0.0 --port 8765 --reload

import json
import asyncio
import uuid
from typing import Dict, Any, AsyncGenerator

from fastapi import FastAPI, Request, HTTPException, Body
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sse_starlette.sse import EventSourceResponse

# ─── Your database imports ────────────────────────────────
# Adjust these according to your actual project structure
from app.db import SessionLocal
from app.models import Product, Order, Query

app = FastAPI(title="Local Shop MCP Server - SSE + Streamable HTTP")

# Simple in-memory session store for Streamable HTTP (use redis/DB in production)
sessions: Dict[str, list] = {}  # session_token → list of pending messages to client

@app.middleware("http")
async def force_no_compression_sse(request: Request, call_next):
    response: Response = await call_next(request)
    
    if request.url.path in ["/sse", "/mcp/sse", "/mcp"]:
        # Remove compression if present
        if "Content-Encoding" in response.headers:
            del response.headers["Content-Encoding"]
        
        response.headers["Content-Encoding"] = "identity"
        response.headers["X-Accel-Buffering"] = "no"
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    
    return response

# Allow browser testing + ngrok
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
#   MCP Discovery - updated for Streamable HTTP
# -------------------------------------------------------------------------
@app.get("/.well-known/mcp.json")
async def mcp_discovery():
    print("[DISCOVERY] /.well-known/mcp.json requested")
    return {
        "protocol_version": "1.0",
        "server_name": "Local E-Shopping MCP Server",
        "description": "Voice agent tools: search products, place orders, ask questions",
        "capabilities": {
            "tools": True,
            "resources": False,
            "prompts": False,
            "sse": True,
            "streamable_http": True
        },
        "endpoints": {
            "mcp": "/mcp",              # Main endpoint for Streamable HTTP
            "tools": "/tools",          # Optional fallback
            "call": "/call",            # Optional fallback
            "sse": "/sse"               # For older SSE-only clients
        }
    }

# -------------------------------------------------------------------------
#   Root - debugging
# -------------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "MCP Server running. Use /mcp for Streamable HTTP or /sse for SSE",
        "discovery": "/.well-known/mcp.json",
        "mcp_endpoint": "/mcp",
        "sse_endpoint": "/sse",
        "tools_endpoint": "/tools",
        "call_endpoint": "/call"
    }

# -------------------------------------------------------------------------
#   List available tools (REST style - optional)
# -------------------------------------------------------------------------
@app.get("/tools")
async def list_tools():
    print("[TOOLS] Requested by client")
    return {
        "tools": [
            {
                "name": "search_products",
                "description": "Search the local shop for products by keyword or name.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search term (e.g. saree, red shirt, cotton kurta)"}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "place_order",
                "description": "Place an order for a product using its ID. Stock is checked and reduced.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "integer", "description": "Product ID from search"},
                        "quantity": {"type": "integer", "description": "How many to order", "default": 1}
                    },
                    "required": ["product_id"]
                }
            },
            {
                "name": "ask_query",
                "description": "Send a question to the shop team (delivery, size, material, etc.)",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string", "description": "The customer's full question"}
                    },
                    "required": ["question"]
                }
            }
        ]
    }

# -------------------------------------------------------------------------
#   Execute tool call (REST style - optional fallback)
# -------------------------------------------------------------------------
class ToolCall(BaseModel):
    tool: str
    parameters: Dict[str, Any]

@app.post("/call")
async def execute_tool(call: ToolCall):
    db = SessionLocal()
    try:
        if call.tool == "search_products":
            q = call.parameters.get("query", "").strip()
            if not q:
                raise ValueError("query parameter is required")
            products = db.query(Product).filter(Product.name.ilike(f"%{q}%")).limit(10).all()
            result = [
                {
                    "id": p.id,
                    "name": p.name,
                    "price": float(p.price),
                    "stock": p.stock,
                    "category": p.category
                }
                for p in products
            ]
            return {"status": "success", "result": result}

        elif call.tool == "place_order":
            pid = call.parameters.get("product_id")
            qty = int(call.parameters.get("quantity", 1))
            if not isinstance(pid, int) or pid <= 0:
                raise ValueError("valid product_id required")
            product = db.query(Product).filter(Product.id == pid).first()
            if not product:
                return {"status": "error", "message": "Product not found"}
            if product.stock < qty:
                return {"status": "error", "message": f"Only {product.stock} left in stock"}
            product.stock -= qty
            order = Order(product_id=pid, quantity=qty, status="CONFIRMED")
            db.add(order)
            db.commit()
            db.refresh(order)
            return {
                "status": "success",
                "order_id": order.id,
                "message": f"Order placed: {qty} × {product.name} (ID: {pid})"
            }

        elif call.tool == "ask_query":
            question = call.parameters.get("question", "").strip()
            if not question:
                raise ValueError("question is required")
            query_entry = Query(question=question, answer="We'll get back to you soon.")
            db.add(query_entry)
            db.commit()
            return {"status": "success", "message": "Question received. Shop team will respond soon."}

        else:
            raise ValueError(f"Unknown tool: {call.tool}")

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

# -------------------------------------------------------------------------
#   Unified Streamable HTTP + SSE endpoint
#   GET  /mcp → SSE stream (server → client)
#   POST /mcp → client messages / tool calls (client → server)
# -------------------------------------------------------------------------
@app.get("/mcp")
@app.get("/sse")
async def stream_endpoint(request: Request):
    session_token = request.query_params.get("session")
    if not session_token:
        session_token = str(uuid.uuid4())
    
    print(f"[STREAM CONNECT] Session: {session_token} from {request.client.host}")

    async def event_generator() -> AsyncGenerator[str, None]:
        # Initial connected event
        yield f"data: {json.dumps({'type': 'connected', 'session': session_token})}\n\n"
        
        # Deliver any queued messages
        if session_token in sessions and sessions[session_token]:
            for msg in sessions[session_token]:
                yield f"data: {json.dumps(msg)}\n\n"
            sessions[session_token].clear()
        
        # Keep-alive
        try:
            while True:
                await asyncio.sleep(15)
                yield ": ping\n\n"
        except asyncio.CancelledError:
            print(f"[STREAM] Session {session_token} disconnected")
            return

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }

    return StreamingResponse(
        event_generator(),
        headers=headers,
        media_type="text/event-stream"
    )

@app.post("/mcp")
async def mcp_post(request: Request, body: Dict = Body(...)):
    session_token = request.query_params.get("session") or str(uuid.uuid4())
    
    print(f"[MCP POST] Session: {session_token} - Body: {body}")
    
    if session_token not in sessions:
        sessions[session_token] = []
    
    # Minimal response: echo / acknowledge
    # → Replace this with real tool execution logic later
    response_msg = {
        "type": "message",
        "role": "assistant",
        "content": "Server received your message. Tools will be processed soon.",
        "timestamp": asyncio.get_event_loop().time()
    }
    
    sessions[session_token].append(response_msg)
    
    return {
        "status": "ok",
        "session": session_token,
        "message": "Request accepted - watch SSE stream for responses"
    }

# -------------------------------------------------------------------------
#   Optional alternative SSE path
# -------------------------------------------------------------------------
@app.get("/mcp/sse")
async def alternative_sse(request: Request):
    return await stream_endpoint(request)

# -------------------------------------------------------------------------
#   Optional debug POST root
# -------------------------------------------------------------------------
@app.post("/")
async def handle_streamable_post():
    return {"status": "ok", "message": "Root POST acknowledged"}

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("  Local E-Shopping MCP Server  (SSE + Streamable HTTP)")
    print("  Discovery     →  http://localhost:8765/.well-known/mcp.json")
    print("  Main endpoint →  http://localhost:8765/mcp   (POST + GET)")
    print("  SSE fallback  →  http://localhost:8765/sse")
    print("  Tools list    →  http://localhost:8765/tools")
    print("  Tool call     →  http://localhost:8765/call  (REST fallback)")
    print("=" * 70)
    print("\nAdd to ElevenLabs:   http://localhost:8765   (or your ngrok URL)")
    print("Recommended transport: Streamable HTTP\n")
    uvicorn.run("mcp_server:app", host="0.0.0.0", port=8765, reload=True)