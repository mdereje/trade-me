from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.services.payment_service import PaymentService
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/stripe/subscribe", response_model=SubscriptionResponse)
async def create_stripe_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe subscription"""
    payment_service = PaymentService(db)
    subscription = payment_service.create_stripe_subscription(current_user.id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create subscription"
        )
    return subscription


@router.post("/paypal/subscribe", response_model=SubscriptionResponse)
async def create_paypal_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a PayPal subscription"""
    payment_service = PaymentService(db)
    subscription = payment_service.create_paypal_subscription(current_user.id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create subscription"
        )
    return subscription


@router.post("/cancel")
async def cancel_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    payment_service = PaymentService(db)
    success = payment_service.cancel_subscription(current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription found"
        )
    return {"message": "Subscription cancelled successfully"}


@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status"""
    payment_service = PaymentService(db)
    subscription = payment_service.get_subscription(current_user.id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found"
        )
    return subscription


@router.post("/webhook/stripe")
async def stripe_webhook(
    request: dict,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks"""
    payment_service = PaymentService(db)
    result = payment_service.handle_stripe_webhook(request)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook"
        )
    return {"status": "success"}


@router.post("/webhook/paypal")
async def paypal_webhook(
    request: dict,
    db: Session = Depends(get_db)
):
    """Handle PayPal webhooks"""
    payment_service = PaymentService(db)
    result = payment_service.handle_paypal_webhook(request)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook"
        )
    return {"status": "success"}
