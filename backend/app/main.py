# backend/app/main.py
from fastapi import FastAPI
from app.db import engine
from app.models import Base
from app.routes import products, orders, queries
from fastapi.staticfiles import StaticFiles
from app.routes import reviews
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite
        "http://localhost:3000"   # CRA (optional)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(queries.router)
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)
app.include_router(reviews.router)

Base.metadata.create_all(bind=engine)
