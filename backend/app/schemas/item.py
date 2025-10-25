from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ItemPhotoBase(BaseModel):
    photo_url: str
    is_primary: bool = False
    order_index: int = 0


class ItemPhotoCreate(ItemPhotoBase):
    pass


class ItemPhotoResponse(ItemPhotoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ItemCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None

    class Config:
        from_attributes = True


class ItemBase(BaseModel):
    title: str
    description: str
    condition: str
    zip_code: str
    city: str
    state: str


class ItemCreate(ItemBase):
    category_id: int
    photos: List[ItemPhotoCreate]


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    category_id: Optional[int] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class ItemResponse(ItemBase):
    id: int
    status: str
    is_visible: bool
    owner_id: int
    category_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    photos: List[ItemPhotoResponse] = []
    category: ItemCategoryResponse
    owner: dict  # Basic user info

    class Config:
        from_attributes = True
