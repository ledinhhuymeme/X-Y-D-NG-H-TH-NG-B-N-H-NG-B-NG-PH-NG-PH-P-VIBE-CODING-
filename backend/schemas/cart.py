from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Request Schemas ---

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


# --- Response Schemas ---

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_price: Optional[float] = None
    product_image: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    quantity: int
    subtotal: Optional[float] = None

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: List[CartItemResponse] = []
    total_price: Optional[float] = 0
    total_amount: Optional[float] = 0
    total_items: Optional[int] = 0

    class Config:
        from_attributes = True
