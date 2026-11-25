from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.user import UserSummary


class ItemPhotoBase(BaseModel):
    photo_url: str
    is_primary: bool = False
    order_index: int = 0


class ItemPhotoCreate(ItemPhotoBase):
    pass


class ItemPhotoResponse(ItemPhotoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    created_at: datetime


class ItemCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class ItemBase(BaseModel):
    title: str
    description: str
    condition: str
    zip_code: str
    city: str
    state: str


class ItemCreate(ItemBase):
    category_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photos: List[ItemPhotoCreate] = Field(default_factory=list)


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    category_id: Optional[int] = None
    zip_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_visible: Optional[bool] = None


class ItemSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    condition: str
    status: str
    city: str
    state: str
    photos: List[ItemPhotoResponse] = Field(default_factory=list)

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        return v.value if isinstance(v, Enum) else v


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    is_visible: bool
    owner_id: int
    category_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    photos: List[ItemPhotoResponse] = Field(default_factory=list)
    category: ItemCategoryResponse
    owner: UserSummary

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        return v.value if isinstance(v, Enum) else v
