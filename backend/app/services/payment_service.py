from sqlalchemy.orm import Session
from app.models.subscription import Subscription
from typing import Optional


class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def create_stripe_subscription(self, user_id: int) -> Optional[Subscription]:
        """Create a Stripe subscription"""
        # Mock implementation for development
        subscription = Subscription(
            user_id=user_id,
            payment_provider="stripe",
            provider_subscription_id="sub_mock_123",
            provider_customer_id="cus_mock_123",
            status="active"
        )

        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def create_paypal_subscription(self, user_id: int) -> Optional[Subscription]:
        """Create a PayPal subscription"""
        # Mock implementation for development
        subscription = Subscription(
            user_id=user_id,
            payment_provider="paypal",
            provider_subscription_id="sub_mock_456",
            provider_customer_id="cus_mock_456",
            status="active"
        )

        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def get_subscription(self, user_id: int) -> Optional[Subscription]:
        """Get user's subscription"""
        return self.db.query(Subscription).filter(Subscription.user_id == user_id).first()

    def cancel_subscription(self, user_id: int) -> bool:
        """Cancel user's subscription"""
        subscription = self.get_subscription(user_id)
        if not subscription:
            return False

        subscription.status = "cancelled"
        self.db.commit()
        return True

    def handle_stripe_webhook(self, request: dict) -> bool:
        """Handle Stripe webhook"""
        # Mock implementation
        return True

    def handle_paypal_webhook(self, request: dict) -> bool:
        """Handle PayPal webhook"""
        # Mock implementation
        return True
