from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.item import ItemSummary
from app.schemas.user import UserSummary


class TradeOfferBase(BaseModel):
    message: Optional[str] = None


class TradeOfferCreate(TradeOfferBase):
    item_id: int
    offered_item_id: int
    is_counter_offer: bool = False
    parent_offer_id: Optional[int] = None


class TradeOfferResponse(TradeOfferBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    item_id: int
    item_owner_id: int
    offerer_id: int
    offered_item_id: int
    is_counter_offer: bool
    parent_offer_id: Optional[int] = None
    created_at: datetime
    responded_at: Optional[datetime] = None

    item: ItemSummary
    offered_item: ItemSummary
    offerer: UserSummary
    item_owner: UserSummary
    counter_offers: List["TradeOfferResponse"] = Field(default_factory=list)

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        return v.value if isinstance(v, Enum) else v


class TradeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    item1_id: int
    item2_id: int
    user1_id: int
    user2_id: int
    notes: Optional[str] = None
    meeting_location: Optional[str] = None
    meeting_time: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    item1: ItemSummary
    item2: ItemSummary
    user1: UserSummary
    user2: UserSummary

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        return v.value if isinstance(v, Enum) else v


TradeOfferResponse.model_rebuild()
