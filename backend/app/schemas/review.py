from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserSummary


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=1, max_length=200)
    comment: Optional[str] = None
    is_public: bool = True
    is_anonymous: bool = False


class ReviewCreate(ReviewBase):
    reviewee_id: int
    trade_id: int


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    comment: Optional[str] = None
    is_public: Optional[bool] = None
    is_anonymous: Optional[bool] = None


class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reviewer_id: Optional[int] = None
    reviewee_id: int
    trade_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    reviewer: Optional[UserSummary] = None
    reviewee: UserSummary
