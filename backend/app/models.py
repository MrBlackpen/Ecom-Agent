# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from .db import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    stock = Column(Integer)

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    image_path = Column(String)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    rating = Column(Integer)  # 1–5
    comment = Column(String)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer)
    quantity = Column(Integer)
    status = Column(String)


class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True)
    question = Column(String)
    answer = Column(String)
