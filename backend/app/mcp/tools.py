# backend/app/mcp/tools.py
from app.db import SessionLocal
from app.models import Product, Order, Query

def search_product(query: str):
    db = SessionLocal()
    return db.query(Product).filter(Product.name.contains(query)).all()

def place_order(product_name: str, quantity: int):
    db = SessionLocal()
    product = db.query(Product).filter(Product.name == product_name).first()
    order = Order(
        product_id=product.id,
        quantity=quantity,
        status="CONFIRMED"
    )
    db.add(order)
    db.commit()
    return order

def ask_query(question: str):
    db = SessionLocal()
    q = Query(question=question, answer="Stored")
    db.add(q)
    db.commit()
    return q
