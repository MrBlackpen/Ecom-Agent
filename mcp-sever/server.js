// mcp-sever/server.js
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const app = express();
app.use(express.json());

/* -----------------------------
   CREATE MCP SERVER INSTANCE
----------------------------- */
const mcp = new McpServer({
  name: "Local E-Commerce MCP",
  version: "1.0.0",
});

/* -----------------------------
   REGISTER TOOLS (correct format)
----------------------------- */
mcp.registerTool(
  "search_product",
  {
    title: "Search Products",
    description: "Search products from local database by keyword",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term (e.g., laptop)" }
      },
      required: ["query"]
    }
  },
  async (input) => {
    const { query } = input;
    const res = await fetch(
      `http://localhost:8000/products/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      throw new Error(`Search failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
);

mcp.registerTool(
  "place_order",
  {
    title: "Place Order",
    description: "Place an order by product ID and quantity",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "number", description: "Product ID from search" },
        quantity: { type: "number", description: "Number of items" }
      },
      required: ["product_id", "quantity"]
    }
  },
  async (input) => {
    const { product_id, quantity } = input;
    const res = await fetch("http://localhost:8000/orders/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id, quantity })
    });
    if (!res.ok) {
      throw new Error(`Order failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
);

mcp.registerTool(
  "ask_query",
  {
    title: "Ask Query",
    description: "Store a customer question for the shop owner",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "User's question" }
      },
      required: ["question"]
    }
  },
  async (input) => {
    const { question } = input;
    const res = await fetch("http://localhost:8000/queries/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });
    if (!res.ok) {
      throw new Error(`Query storage failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }
);

/* -----------------------------
   SSE ENDPOINT (for ElevenLabs discovery & connection)
----------------------------- */
app.get("/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // MCP SDK handles the SSE connection
  const transport = mcp.createTransport({ type: "sse", req, res });

  // Heartbeat to keep connection alive (prevents timeouts)
  const interval = setInterval(() => {
    res.write("data: ping\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(interval);
    transport.close?.();
  });
});

/* -----------------------------
   Health check
----------------------------- */
app.get("/", (req, res) => {
  res.json({ status: "MCP server running", sse_endpoint: "/sse" });
});

/* -----------------------------
   START SERVER
----------------------------- */
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`✅ MCP Server running at http://localhost:${PORT}/sse`);
  console.log("→ Use ngrok HTTPS base URL in ElevenLabs (e.g. https://xxxx.ngrok-free.app)");
});