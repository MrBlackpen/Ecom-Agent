# mcp_server.py
# Simple JSON-RPC MCP server for ElevenLabs (recommended for ngrok free tier)

import json
from typing import Dict, Any
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.db import SessionLocal
from app.models import Product, Order, Query, Review

app = FastAPI(title="Local Shop MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MCP_TOOLS = [
    {
        "name": "search_products",
        "title": "Search products",
        "description": "Search the local shop for products by keyword or name.",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "Search term (e.g. saree, red shirt, cotton kurta)"}},
            "required": ["query"],
        },
    },
    {
        "name": "add_to_cart",
        "title": "Add product to cart",
        "description": "Add a product to the customer's cart using product ID and quantity. Does NOT place the order.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": {"type": "integer", "description": "Product ID from search"},
                "quantity": {"type": "integer", "description": "How many to add", "default": 1},
            },
            "required": ["product_id"],
        },
    },
    {
        "name": "ask_query",
        "title": "Ask a question",
        "description": "Send a question to the shop team (delivery, size, material, etc.).",
        "inputSchema": {
            "type": "object",
            "properties": {"question": {"type": "string", "description": "The customer's full question"}},
            "required": ["question"],
        },
    },
    {
        "name": "get_reviews",
        "title": "Get product reviews",
        "description": "Fetch customer reviews for a product using product ID",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": { "type": "integer" }
            },
            "required": ["product_id"]
        }
    },
]

# Simple in-memory buffer of recent tool calls (for local dev/debug)
RECENT_TOOL_CALLS = []
_RECENT_ID = 0


def run_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        if name == "search_products":
            q = (arguments.get("query") or "").strip()

            if not q:
                # Return ALL products when query is empty / missing
                products = db.query(Product).limit(20).all()   # ← add limit to avoid huge responses
            else:
                terms = q.lower().split()

                products = db.query(Product).filter(*[Product.name.ilike(f"%{t}%") for t in terms]).limit(10).all()

            result = [{"id": p.id, "name": p.name or "", "price": float(p.price or 0), "stock": p.stock or 0, "category": p.category or ""} for p in products]
            return {"status": "success", "result": result}

        elif name == "add_to_cart":
            pid = arguments.get("product_id")
            qty = int(arguments.get("quantity", 1))

            product = db.query(Product).filter(Product.id == pid).first()

            if not product:
                return {"status": "error", "message": "Product not found"}

            if product.stock < qty:
                return {"status": "error", "message": f"Only {product.stock} left"}

            return {
                "status": "success",
                "result": {
                    "id": product.id,
                    "name": product.name,
                    "price": float(product.price),
                    "quantity": qty
                },
                "message": f"{qty} × {product.name} added to cart"
            }

        elif name == "ask_query":
            question = (arguments.get("question") or "").strip()
            if not question:
                return {"status": "error", "message": "question required"}
            query_entry = Query(question=question, answer="We'll get back to you soon.")
            db.add(query_entry)
            db.commit()
            return {"status": "success", "message": "Question received."}
        
        elif name == "get_reviews":
            pid = arguments.get("product_id")
            reviews = db.query(Review).filter(Review.product_id == pid).all()

            if not reviews:
                return {
                    "status": "success",
                    "result": "No reviews yet for this product."
                }

            return {
                "status": "success",
                "result": [
                    {"rating": r.rating, "comment": r.comment}
                    for r in reviews
                ]
            }

        return {"status": "error", "message": f"Unknown tool: {name}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@app.get("/")
@app.get("/.well-known/mcp.json")
async def discovery():
    """Discovery + tools list (ElevenLabs looks here)"""
    return {
        "protocol_version": "1.0",
        "server_name": "Local Shop MCP Server",
        "description": "Voice agent tools: search products, place orders, ask questions",
        "capabilities": {"tools": True},
        "tools": MCP_TOOLS,
    }


@app.post("/")
@app.post("/mcp")
async def handle_jsonrpc(request: Request):
    try:
        body = await request.json()
        print("→ MCP received:", body)
    except:
        return JSONResponse(status_code=400, content={"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}})

    method = body.get("method")
    params = body.get("params", {})
    msg_id = body.get("id")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {
                "protocolVersion": "2025-03-26",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "local-shop-mcp", "title": "Local Shop MCP Server", "version": "1.0.0"},
            },
        }

    elif method == "tools/list":
        return {"jsonrpc": "2.0", "id": msg_id, "result": {"tools": MCP_TOOLS}}

    elif method == "tools/call":
        name = params.get("name", "").strip()
        args = params.get("arguments", {})

        print("🛠 MCP TOOL CALLED:", name)
        print("📥 ARGUMENTS:", args)

        if not name or name not in {t["name"] for t in MCP_TOOLS}:
            return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32602, "message": "Invalid tool name"}}

        result = run_tool(name, args)
        # record recent call
        try:
            global _RECENT_ID
            _RECENT_ID += 1
            RECENT_TOOL_CALLS.append({"id": _RECENT_ID, "name": name, "arguments": args, "result": result, "message": result.get("message")})
            # keep buffer small
            if len(RECENT_TOOL_CALLS) > 50:
                RECENT_TOOL_CALLS.pop(0)
        except Exception:
            pass
        print(f"← Tool result: {result}")
        is_error = result.get("status") == "error"

        text = result.get("message") or json.dumps(result.get("result", result), default=str)

        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {"content": [{"type": "text", "text": text}], "isError": is_error},
        }

    elif method == "recent_tool_calls":
        # return recent tool calls (useful for local dev polling)
        since_id = params.get("since_id") or 0
        entries = [e for e in RECENT_TOOL_CALLS if e["id"] > int(since_id)]
        return {"jsonrpc": "2.0", "id": msg_id, "result": {"entries": entries}}

    else:
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": f"Method not found: {method}"}}


if __name__ == "__main__":
    import uvicorn
    print("Local Shop MCP Server (JSON-RPC mode) → http://localhost:8765")
    uvicorn.run("mcp_server:app", host="0.0.0.0", port=8765, reload=True)