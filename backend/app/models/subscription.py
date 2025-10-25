from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class SubscriptionStatus(enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    INCOMPLETE = "incomplete"


class PaymentProvider(enum.Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"),
                     nullable=False, unique=True)

    # Subscription details
    status = Column(Enum(SubscriptionStatus),
                    default=SubscriptionStatus.ACTIVE)
    payment_provider = Column(Enum(PaymentProvider), nullable=False)

    # Payment details
    provider_subscription_id = Column(String, nullable=False)
    provider_customer_id = Column(String, nullable=False)

    # Pricing
    amount = Column(Float, default=1.0)  # $1 per week
    currency = Column(String, default="USD")

    # Billing cycle
    billing_cycle = Column(String, default="weekly")
    next_billing_date = Column(DateTime(timezone=True))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    cancelled_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="subscription")
