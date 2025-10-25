from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SubscriptionBase(BaseModel):
    payment_provider: str
    amount: float = 1.0
    currency: str = "USD"
    billing_cycle: str = "weekly"


class SubscriptionCreate(SubscriptionBase):
    provider_subscription_id: str
    provider_customer_id: str


class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    status: str
    next_billing_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    class Config:
        from_attributes = True
