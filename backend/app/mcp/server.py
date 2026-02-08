# backend/app/mcp/server.py
from fastmcp import FastMCP
from app.mcp.tools import search_product, place_order, ask_query

mcp = FastMCP(
    name="Local E-Commerce MCP"
)

@mcp.tool()
def search_product(query: str) -> list:
    """Search products from the local database by name or keyword.
    Returns a list of matching products with id, name, price, stock."""
    return search_product(query)

@mcp.tool()
def place_order(product_name: str, quantity: int) -> dict:
    """Place an order for a product by its exact name and desired quantity.
    Returns the created order details."""
    return place_order(product_name, quantity)

@mcp.tool()
def ask_query(question: str) -> dict:
    """Store a customer question/query for the shop owner to answer later.
    Returns confirmation with the stored question."""
    return ask_query(question)

app = mcp.streamable_http_app()