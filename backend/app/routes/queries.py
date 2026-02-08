# backend/app/routes/queries.py
from fastapi import APIRouter
from ..models import Query
from ..db import SessionLocal

router = APIRouter(prefix="/queries")

@router.post("/")
def ask_query(question: str):
    db = SessionLocal()
    q = Query(question=question, answer="We will get back soon")
    db.add(q)
    db.commit()
    return q
