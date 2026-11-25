from datetime import datetime, timezone
import logging
import os
from typing import Any, Dict, Optional
import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.subscription import (
    PaymentProvider,
    Subscription,
    SubscriptionStatus,
    WebhookEvent,
)
from app.models.user import User
from app.schemas.subscription import (
    CheckoutResponse,
    PlanOption,
    PlansResponse,
    PortalResponse,
    SubscriptionStatusResponse,
)

logger = logging.getLogger(__name__)

FREE_ACTIVE_LISTING_LIMIT = 1

PLAN_CATALOG: Dict[str, Dict[str, Any]] = {
    "monthly": {
        "id": "monthly",
        "name": "Monthly Membership",
        "price_cents": 99,
        "price_display": "$0.99/month",
        "currency": "USD",
        "interval": "month",
        "savings_percent": 0,
        "highlighted": False,
        "description": "Flexible month-to-month access. Unlimited listings, trade offers, and counter-offers. Cancel anytime.",
    },
    "annual": {
        "id": "annual",
        "name": "Annual Membership",
        "price_cents": 1000,
        "price_display": "$10/year",
        "currency": "USD",
        "interval": "year",
        "savings_percent": 16,
        "highlighted": True,
        "description": "Best value — just $0.83/month billed annually (save 16%). Unlimited listings and trades all year.",
    },
}

STRIPE_STATUS_MAP = {
    "trialing": SubscriptionStatus.TRIALING,
    "active": SubscriptionStatus.ACTIVE,
    "past_due": SubscriptionStatus.PAST_DUE,
    "canceled": SubscriptionStatus.CANCELLED,
    "cancelled": SubscriptionStatus.CANCELLED,
    "incomplete": SubscriptionStatus.INCOMPLETE,
    "incomplete_expired": SubscriptionStatus.CANCELLED,
    "unpaid": SubscriptionStatus.UNPAID,
}


def _unix_to_dt(ts: Optional[int]) -> Optional[datetime]:
    if not ts:
        return None
    return datetime.fromtimestamp(int(ts), tz=timezone.utc)


def _get_frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")


def _get_stripe_price_id(plan: str) -> Optional[str]:
    if plan == "monthly":
        return os.getenv("STRIPE_PRICE_MONTHLY_ID", "").strip() or None
    if plan == "annual":
        return os.getenv("STRIPE_PRICE_ANNUAL_ID", "").strip() or None
    return None


def is_subscription_active(sub: Optional[Subscription]) -> bool:
    if not sub:
        return False
    if sub.status not in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING):
        return False
    if sub.current_period_end is not None:
        end = sub.current_period_end
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if end < datetime.now(timezone.utc):
            return False
    return True


class PaymentService:
    def __init__(self, db: Session):
        self.db = db

    def _configure_stripe(self) -> str:
        secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
        if not secret_key or secret_key.startswith("sk_test_your_"):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe billing is not configured on this server yet.",
            )
        stripe.api_key = secret_key
        return secret_key

    def get_plans(self) -> PlansResponse:
        secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
        configured = bool(
            secret_key
            and not secret_key.startswith("sk_test_your_")
            and _get_stripe_price_id("monthly")
            and _get_stripe_price_id("annual")
        )
        return PlansResponse(
            plans=[PlanOption(**PLAN_CATALOG["annual"]), PlanOption(**PLAN_CATALOG["monthly"])],
            stripe_configured=configured,
        )

    def get_subscription(self, user_id: int) -> Optional[Subscription]:
        return (
            self.db.query(Subscription)
            .filter(Subscription.user_id == user_id)
            .first()
        )

    def get_subscription_status(self, user_id: int) -> SubscriptionStatusResponse:
        sub = self.get_subscription(user_id)
        if not sub:
            return SubscriptionStatusResponse(
                is_active=False,
                status="none",
                free_listing_limit=FREE_ACTIVE_LISTING_LIMIT,
            )
        return SubscriptionStatusResponse(
            is_active=is_subscription_active(sub),
            status=sub.status.value,
            plan_type=sub.plan_type,
            amount_cents=sub.amount_cents,
            currency=sub.currency,
            current_period_end=sub.current_period_end,
            cancel_at_period_end=bool(sub.cancel_at_period_end),
            trial_end=sub.trial_end,
            free_listing_limit=FREE_ACTIVE_LISTING_LIMIT,
        )

    def _get_or_create_stripe_customer(self, user: User) -> str:
        if user.stripe_customer_id:
            return user.stripe_customer_id
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id), "username": user.username},
        )
        user.stripe_customer_id = customer["id"]
        self.db.commit()
        self.db.refresh(user)
        return user.stripe_customer_id

    def create_checkout_session(self, user: User, plan: str) -> CheckoutResponse:
        """Create a hosted Stripe Checkout Session for $0.99/mo or $10/yr."""
        self._configure_stripe()
        if plan not in PLAN_CATALOG:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan. Choose 'monthly' or 'annual'.",
            )

        existing = self.get_subscription(user.id)
        if is_subscription_active(existing):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active membership. Use the billing portal to switch plans or manage billing.",
            )

        price_id = _get_stripe_price_id(plan)
        if not price_id:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Stripe price ID for '{plan}' plan is not configured.",
            )

        customer_id = self._get_or_create_stripe_customer(user)
        frontend_url = _get_frontend_url()

        subscription_data: Dict[str, Any] = {
            "metadata": {"user_id": str(user.id), "plan": plan}
        }
        trial_days = int(os.getenv("STRIPE_TRIAL_DAYS", "0") or "0")
        if trial_days > 0 and not existing:
            subscription_data["trial_period_days"] = trial_days

        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            allow_promotion_codes=True,
            client_reference_id=str(user.id),
            metadata={"user_id": str(user.id), "plan": plan},
            subscription_data=subscription_data,
            success_url=f"{frontend_url}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/billing/cancel",
        )
        return CheckoutResponse(checkout_url=session["url"], session_id=session["id"])

    def create_portal_session(self, user: User) -> PortalResponse:
        """Create a Stripe Billing Portal session for self-serve management/cancellation."""
        self._configure_stripe()
        customer_id = user.stripe_customer_id
        if not customer_id:
            sub = self.get_subscription(user.id)
            customer_id = sub.provider_customer_id if sub else None

        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No billing profile found for this account.",
            )

        portal = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{_get_frontend_url()}/profile",
        )
        return PortalResponse(portal_url=portal["url"])

    def _infer_plan_from_price(self, price_id: Optional[str], fallback_plan: Optional[str] = None) -> str:
        if price_id:
            if price_id == _get_stripe_price_id("monthly"):
                return "monthly"
            if price_id == _get_stripe_price_id("annual"):
                return "annual"
        if fallback_plan in PLAN_CATALOG:
            return fallback_plan
        return "annual"

    def _upsert_subscription_from_stripe(
        self,
        user_id: int,
        customer_id: str,
        subscription_id: str,
        stripe_status: str,
        price_id: Optional[str] = None,
        plan_hint: Optional[str] = None,
        current_period_start: Optional[int] = None,
        current_period_end: Optional[int] = None,
        cancel_at_period_end: bool = False,
        trial_end: Optional[int] = None,
    ) -> Subscription:
        mapped_status = STRIPE_STATUS_MAP.get(stripe_status, SubscriptionStatus.INCOMPLETE)
        plan_type = self._infer_plan_from_price(price_id, plan_hint)
        plan_info = PLAN_CATALOG[plan_type]

        sub = self.get_subscription(user_id)
        if not sub:
            sub = Subscription(
                user_id=user_id,
                payment_provider=PaymentProvider.STRIPE,
                provider_subscription_id=subscription_id,
                provider_customer_id=customer_id,
            )
            self.db.add(sub)

        sub.status = mapped_status
        sub.payment_provider = PaymentProvider.STRIPE
        sub.provider_subscription_id = subscription_id
        sub.provider_customer_id = customer_id
        sub.stripe_price_id = price_id
        sub.plan_type = plan_type
        sub.billing_cycle = plan_type
        sub.amount_cents = plan_info["price_cents"]
        sub.amount = plan_info["price_cents"] / 100.0
        sub.currency = plan_info["currency"]
        sub.cancel_at_period_end = bool(cancel_at_period_end)

        if current_period_start:
            sub.current_period_start = _unix_to_dt(current_period_start)
        if current_period_end:
            period_end_dt = _unix_to_dt(current_period_end)
            sub.current_period_end = period_end_dt
            sub.next_billing_date = period_end_dt
        sub.trial_end = _unix_to_dt(trial_end)

        if mapped_status == SubscriptionStatus.CANCELLED:
            sub.cancelled_at = datetime.now(timezone.utc)
        else:
            sub.cancelled_at = None

        user = self.db.query(User).filter(User.id == user_id).first()
        if user and not user.stripe_customer_id:
            user.stripe_customer_id = customer_id

        return sub

    def _resolve_user_id(
        self, customer_id: Optional[str], metadata: Optional[dict], client_reference_id: Optional[str] = None
    ) -> Optional[int]:
        if metadata and metadata.get("user_id"):
            try:
                return int(metadata["user_id"])
            except (ValueError, TypeError):
                pass
        if client_reference_id:
            try:
                return int(client_reference_id)
            except (ValueError, TypeError):
                pass
        if customer_id:
            user = (
                self.db.query(User)
                .filter(User.stripe_customer_id == customer_id)
                .first()
            )
            if user:
                return user.id
            sub = (
                self.db.query(Subscription)
                .filter(Subscription.provider_customer_id == customer_id)
                .first()
            )
            if sub:
                return sub.user_id
        return None

    def handle_stripe_webhook(
        self, raw_body: bytes, sig_header: Optional[str]
    ) -> Dict[str, str]:
        """Verify Stripe webhook signature, enforce idempotency, and sync subscription state."""
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
        if not webhook_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe webhook secret is not configured.",
            )
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe-Signature header.",
            )

        try:
            event = stripe.Webhook.construct_event(raw_body, sig_header, webhook_secret)
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            logger.warning("Stripe webhook signature verification failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Stripe webhook payload or signature.",
            )

        event_id = event["id"]
        event_type = event["type"]

        # Idempotency check
        if (
            self.db.query(WebhookEvent)
            .filter(WebhookEvent.event_id == event_id)
            .first()
        ):
            return {"status": "duplicate", "event_id": event_id}

        obj = event["data"]["object"]

        if event_type == "checkout.session.completed":
            if obj.get("mode") == "subscription" and obj.get("subscription"):
                user_id = self._resolve_user_id(
                    obj.get("customer"),
                    obj.get("metadata"),
                    obj.get("client_reference_id"),
                )
                if user_id:
                    plan_hint = (obj.get("metadata") or {}).get("plan")
                    self._upsert_subscription_from_stripe(
                        user_id=user_id,
                        customer_id=obj.get("customer", ""),
                        subscription_id=obj["subscription"],
                        stripe_status="active",
                        plan_hint=plan_hint,
                    )

        elif event_type in (
            "customer.subscription.created",
            "customer.subscription.updated",
            "customer.subscription.deleted",
        ):
            customer_id = obj.get("customer")
            metadata = obj.get("metadata") or {}
            user_id = self._resolve_user_id(customer_id, metadata)
            if user_id:
                items = (obj.get("items") or {}).get("data") or []
                price_id = items[0]["price"]["id"] if items and items[0].get("price") else None
                self._upsert_subscription_from_stripe(
                    user_id=user_id,
                    customer_id=customer_id or "",
                    subscription_id=obj["id"],
                    stripe_status=obj.get("status", "incomplete"),
                    price_id=price_id,
                    plan_hint=metadata.get("plan"),
                    current_period_start=obj.get("current_period_start"),
                    current_period_end=obj.get("current_period_end"),
                    cancel_at_period_end=obj.get("cancel_at_period_end", False),
                    trial_end=obj.get("trial_end"),
                )

        elif event_type == "invoice.payment_failed":
            customer_id = obj.get("customer")
            user_id = self._resolve_user_id(customer_id, obj.get("metadata"))
            if user_id:
                sub = self.get_subscription(user_id)
                if sub:
                    sub.status = SubscriptionStatus.PAST_DUE

        elif event_type == "invoice.paid":
            customer_id = obj.get("customer")
            user_id = self._resolve_user_id(customer_id, obj.get("metadata"))
            if user_id:
                sub = self.get_subscription(user_id)
                if sub and sub.status == SubscriptionStatus.PAST_DUE:
                    sub.status = SubscriptionStatus.ACTIVE

        self.db.add(WebhookEvent(event_id=event_id, event_type=event_type))
        self.db.commit()
        return {"status": "processed", "event_id": event_id}
