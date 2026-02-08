# backend/app/routes/orders.py
from fastapi import APIRouter
from ..models import Order
from ..db import SessionLocal

router = APIRouter(prefix="/orders")

@router.post("/")
def place_order(product_id: int, quantity: int):
    db = SessionLocal()
    order = Order(
        product_id=product_id,
        quantity=quantity,
        status="CONFIRMED"
    )
    db.add(order)
    db.commit()
    return order
