# backend/app/schemas/product_schema.py
from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock: int
