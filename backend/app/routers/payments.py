from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.subscription import (
    CheckoutRequest,
    CheckoutResponse,
    PlansResponse,
    PortalResponse,
    SubscriptionStatusResponse,
)
from app.services.payment_service import PaymentService
from app.utils.auth import get_current_user

router = APIRouter()


@router.get("/plans", response_model=PlansResponse)
async def get_plans(db: Session = Depends(get_db)):
    """Public endpoint returning Trade Me membership plans ($0.99/mo & $10/yr)."""
    return PaymentService(db).get_plans()


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    payload: CheckoutRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Checkout Session for the chosen plan."""
    return PaymentService(db).create_checkout_session(current_user, payload.plan)


@router.post("/portal", response_model=PortalResponse)
async def create_billing_portal(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe Billing Portal session for managing or canceling membership."""
    return PaymentService(db).create_portal_session(current_user)


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get normalized subscription entitlement status for the authenticated user."""
    return PaymentService(db).get_subscription_status(current_user.id)


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    """Verify and process incoming Stripe webhook events (raw body required)."""
    raw_body = await request.body()
    return PaymentService(db).handle_stripe_webhook(raw_body, stripe_signature)
