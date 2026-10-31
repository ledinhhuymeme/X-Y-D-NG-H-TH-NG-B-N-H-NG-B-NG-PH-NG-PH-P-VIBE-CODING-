from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Request Schemas ---

class ProductCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    stock: int = 0
    image_url: Optional[str] = None
    is_featured: bool = False
    is_active: bool = True
    size: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    brand: Optional[str] = None
    category_id: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    size: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[int] = None


class ProductImageCreate(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0


# --- Response Schemas ---

class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool
    sort_order: int

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    stock: int
    image_url: Optional[str] = None
    is_featured: bool
    is_active: bool
    size: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    brand: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    average_rating: Optional[float] = 0
    review_count: Optional[int] = 0
    discount_percentage: Optional[int] = 0
    images: Optional[List[ProductImageResponse]] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
