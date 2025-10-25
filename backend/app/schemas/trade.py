from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TradeOfferBase(BaseModel):
    message: Optional[str] = None


class TradeOfferCreate(TradeOfferBase):
    item_id: int
    offered_item_id: int
    is_counter_offer: bool = False
    parent_offer_id: Optional[int] = None


class TradeOfferResponse(TradeOfferBase):
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

    # Related objects
    item: dict  # Basic item info
    offered_item: dict  # Basic item info
    offerer: dict  # Basic user info
    item_owner: dict  # Basic user info
    counter_offers: List['TradeOfferResponse'] = []

    class Config:
        from_attributes = True


class TradeResponse(BaseModel):
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

    # Related objects
    item1: dict  # Basic item info
    item2: dict  # Basic item info
    user1: dict  # Basic user info
    user2: dict  # Basic user info

    class Config:
        from_attributes = True
