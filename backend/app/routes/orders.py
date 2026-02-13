# backend/app/routes/orders.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..models import Order, Product
from ..db import SessionLocal

router = APIRouter(prefix="/orders")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def place_order(product_id: int, quantity: int, db: Session = Depends(get_db)):
    # Get the product
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        return {"error": "Product not found"}, 404
    
    if product.stock < quantity:
        return {"error": "Insufficient stock"}, 400
    
    # Reduce stock
    product.stock -= quantity
    
    # Create order
    order = Order(
        product_id=product_id,
        quantity=quantity,
        status="CONFIRMED"
    )
    
    db.add(order)
    db.commit()
    
    return {
        "id": order.id,
        "product_id": order.product_id,
        "quantity": order.quantity,
        "status": order.status
    }
