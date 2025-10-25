from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    rating: int
    title: str
    comment: Optional[str] = None
    is_public: bool = True
    is_anonymous: bool = False


class ReviewCreate(ReviewBase):
    reviewee_id: int
    trade_id: int


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    title: Optional[str] = None
    comment: Optional[str] = None
    is_public: Optional[bool] = None
    is_anonymous: Optional[bool] = None


class ReviewResponse(ReviewBase):
    id: int
    reviewer_id: int
    reviewee_id: int
    trade_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Related objects
    reviewer: dict  # Basic user info (if not anonymous)
    reviewee: dict  # Basic user info

    class Config:
        from_attributes = True
