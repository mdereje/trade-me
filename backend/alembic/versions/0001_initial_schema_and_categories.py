"""Initial Trade Me schema and default item categories

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-25 14:16:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.utils.seed import DEFAULT_CATEGORIES

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=True),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("phone_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("zip_code", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("state", sa.String(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("google_id", sa.String(), nullable=True, unique=True),
        sa.Column("facebook_id", sa.String(), nullable=True, unique=True),
        sa.Column("twitter_id", sa.String(), nullable=True, unique=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("profile_picture", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_phone_number", "users", ["phone_number"], unique=True)

    categories_table = op.create_table(
        "item_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_item_categories_id", "item_categories", ["id"])

    op.create_table(
        "items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("condition", sa.String(), nullable=False),
        sa.Column("zip_code", sa.String(), nullable=False),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("state", sa.String(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "TRADED", "ARCHIVED", name="itemstatus"),
            nullable=True,
        ),
        sa.Column("is_visible", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("item_categories.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_items_id", "items", ["id"])

    op.create_table(
        "item_photos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("photo_url", sa.String(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_item_photos_id", "item_photos", ["id"])

    op.create_table(
        "trades",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "status",
            sa.Enum("PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED", name="tradestatus"),
            nullable=True,
        ),
        sa.Column("item1_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("item2_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("user1_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("user2_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("meeting_location", sa.String(), nullable=True),
        sa.Column("meeting_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_trades_id", "trades", ["id"])

    op.create_table(
        "trade_offers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "status",
            sa.Enum("PENDING", "ACCEPTED", "REJECTED", "COUNTERED", "WITHDRAWN", name="tradeofferstatus"),
            nullable=True,
        ),
        sa.Column("item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("item_owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("offerer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("offered_item_id", sa.Integer(), sa.ForeignKey("items.id"), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("is_counter_offer", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("parent_offer_id", sa.Integer(), sa.ForeignKey("trade_offers.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_trade_offers_id", "trade_offers", ["id"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reviewer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reviewee_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("trade_id", sa.Integer(), sa.ForeignKey("trades.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_anonymous", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_reviews_id", "reviews", ["id"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "CANCELLED", "PAST_DUE", "INCOMPLETE", name="subscriptionstatus"),
            nullable=True,
        ),
        sa.Column(
            "payment_provider",
            sa.Enum("STRIPE", "PAYPAL", name="paymentprovider"),
            nullable=False,
        ),
        sa.Column("provider_subscription_id", sa.String(), nullable=False),
        sa.Column("provider_customer_id", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), server_default="1.0"),
        sa.Column("currency", sa.String(), server_default="USD"),
        sa.Column("billing_cycle", sa.String(), server_default="weekly"),
        sa.Column("next_billing_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_subscriptions_id", "subscriptions", ["id"])

    op.create_table(
        "phone_verification_codes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone_number", sa.String(), nullable=False),
        sa.Column("code", sa.String(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_phone_verification_codes_id", "phone_verification_codes", ["id"])
    op.create_index(
        "ix_phone_verification_codes_phone_number",
        "phone_verification_codes",
        ["phone_number"],
    )

    op.bulk_insert(categories_table, DEFAULT_CATEGORIES)


def downgrade() -> None:
    op.drop_table("phone_verification_codes")
    op.drop_table("subscriptions")
    op.drop_table("reviews")
    op.drop_table("trade_offers")
    op.drop_table("trades")
    op.drop_table("item_photos")
    op.drop_table("items")
    op.drop_table("item_categories")
    op.drop_table("users")
