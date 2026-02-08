# backend/app/schemas/review_schema.py
from pydantic import BaseModel

class ReviewCreate(BaseModel):
    product_id: int
    rating: int
    comment: str
