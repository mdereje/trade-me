import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SubscriptionStatus(enum.Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    INCOMPLETE = "incomplete"
    UNPAID = "unpaid"


class PaymentProvider(enum.Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Subscription details
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.INCOMPLETE, nullable=False)
    payment_provider = Column(Enum(PaymentProvider), default=PaymentProvider.STRIPE, nullable=False)

    # Payment provider IDs
    provider_subscription_id = Column(String, nullable=False, index=True)
    provider_customer_id = Column(String, nullable=False, index=True)
    stripe_price_id = Column(String, nullable=True)

    # Pricing ($0.99/mo = 99 cents, $10/yr = 1000 cents)
    plan_type = Column(String, default="annual", nullable=False)  # "monthly" | "annual"
    amount_cents = Column(Integer, default=1000, nullable=False)
    amount = Column(Float, default=10.0)
    currency = Column(String, default="USD", nullable=False)

    # Billing cycle
    billing_cycle = Column(String, default="annual", nullable=False)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    next_billing_date = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, default=False, nullable=False)
    trial_end = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="subscription")


class WebhookEvent(Base):
    """Stores processed Stripe webhook event IDs to guarantee idempotency."""
    __tablename__ = "webhook_events"

    event_id = Column(String, primary_key=True)
    event_type = Column(String, nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
