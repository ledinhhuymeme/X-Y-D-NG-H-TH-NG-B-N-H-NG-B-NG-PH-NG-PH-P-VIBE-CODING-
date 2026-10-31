from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Request Schemas ---

class ReviewCreate(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None


# --- Response Schemas ---

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    product_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
