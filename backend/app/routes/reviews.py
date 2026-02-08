# backend/app/routes/reviews.py
from fastapi import APIRouter
from ..models import Review
from ..db import SessionLocal
from ..schemas.review_schema import ReviewCreate

router = APIRouter(prefix="/reviews")

@router.post("/")
def add_review(review: ReviewCreate):
    db = SessionLocal()
    r = Review(
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@router.get("/{product_id}")
def get_reviews(product_id: int):
    db = SessionLocal()
    return db.query(Review).filter(Review.product_id == product_id).all()
