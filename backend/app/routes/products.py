# backend/app/routes/products.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models import Product, ProductImage, Review
from fastapi import UploadFile, File
import shutil
import uuid
from pathlib import Path
from ..schemas.product_schema import ProductCreate

UPLOAD_DIR = Path("uploads/product_images")

router = APIRouter(prefix="/products")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []

    for p in products:
        images = db.query(ProductImage).filter_by(product_id=p.id).all()
        reviews = db.query(Review).filter_by(product_id=p.id).all()

        result.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "stock": p.stock,
            "images": [img.image_path.replace("uploads", "/uploads") for img in images],
            "reviews": reviews
        })

    return result

@router.get("/search")
def search_products(q: str, db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.name.contains(q)).all()

@router.post("/{product_id}/upload-image")
def upload_image(product_id: int, file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = ProductImage(
        product_id=product_id,
        image_path=str(file_path)
    )
    db = SessionLocal()
    db.add(img)
    db.commit()

    return {"image_url": f"/uploads/product_images/{filename}"}

@router.post("/")
def create_product(product: ProductCreate):
    db = SessionLocal()
    new_product = Product(
        name=product.name,
        category=product.category,
        price=product.price,
        stock=product.stock
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product