from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict


class PlanOption(BaseModel):
    id: Literal["monthly", "annual"]
    name: str
    price_cents: int
    price_display: str
    currency: str = "USD"
    interval: Literal["month", "year"]
    savings_percent: int = 0
    highlighted: bool = False
    description: str


class PlansResponse(BaseModel):
    plans: List[PlanOption]
    stripe_configured: bool


class CheckoutRequest(BaseModel):
    plan: Literal["monthly", "annual"] = "annual"


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PortalResponse(BaseModel):
    portal_url: str


class SubscriptionStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    is_active: bool
    status: str  # "none" | "trialing" | "active" | "past_due" | "cancelled" | "incomplete" | "unpaid"
    plan_type: Optional[str] = None
    amount_cents: Optional[int] = None
    currency: str = "USD"
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    trial_end: Optional[datetime] = None
    free_listing_limit: int = 1
