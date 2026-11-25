from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    phone_number: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None
    google_id: Optional[str] = None
    facebook_id: Optional[str] = None
    twitter_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SocialTokenRequest(BaseModel):
    token: str


class PhoneNumberRequest(BaseModel):
    phone_number: str


class PhoneVerifyRequest(BaseModel):
    phone_number: str
    verification_code: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None


class UserSummary(BaseModel):
    """Public-safe compact user summary embedded in items, trades, and reviews."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    profile_picture: Optional[str] = None
    is_verified: bool = False


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone_verified: bool
    is_active: bool
    is_verified: bool
    profile_picture: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None


class UserProfile(UserResponse):
    items_count: int = 0
    trades_completed: int = 0
    average_rating: Optional[float] = None
    reviews_count: int = 0


class PublicUserProfile(BaseModel):
    """Public-facing trader profile with private PII (email, phone) stripped."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    city: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    items_count: int = 0
    trades_completed: int = 0
    average_rating: Optional[float] = None
    reviews_count: int = 0
