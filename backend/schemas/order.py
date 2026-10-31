from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Request Schemas ---

class OrderCreate(BaseModel):
    shipping_name: str
    shipping_phone: str
    shipping_address: str
    payment_method: str = "cod"  # cod, bank_transfer, credit_card, e_wallet
    note: Optional[str] = None
    coupon_code: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, shipping, delivered, completed, cancelled


# --- Response Schemas ---

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: float
    product_image: Optional[str] = None
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    order_code: str
    user_id: int
    user_name: Optional[str] = None
    total_amount: float
    shipping_fee: float
    discount_amount: float
    final_amount: float
    status: str
    payment_method: str
    shipping_name: str
    shipping_phone: str
    shipping_address: str
    note: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
