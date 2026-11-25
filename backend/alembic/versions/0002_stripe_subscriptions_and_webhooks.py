"""Add Stripe subscription fields, user.stripe_customer_id, and webhook_events table

Revision ID: 0002_stripe_billing
Revises: 0001_initial
Create Date: 2026-11-25 14:22:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_stripe_billing"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    # On PostgreSQL, extend subscriptionstatus enum with TRIALING and UNPAID
    if dialect == "postgresql":
        op.execute("ALTER TYPE subscriptionstatus ADD VALUE IF NOT EXISTS 'TRIALING'")
        op.execute("ALTER TYPE subscriptionstatus ADD VALUE IF NOT EXISTS 'UNPAID'")

    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("stripe_customer_id", sa.String(), nullable=True))
        batch_op.create_index("ix_users_stripe_customer_id", ["stripe_customer_id"], unique=True)

    with op.batch_alter_table("subscriptions") as batch_op:
        batch_op.add_column(sa.Column("stripe_price_id", sa.String(), nullable=True))
        batch_op.add_column(
            sa.Column("plan_type", sa.String(), nullable=False, server_default="annual")
        )
        batch_op.add_column(
            sa.Column("amount_cents", sa.Integer(), nullable=False, server_default="1000")
        )
        batch_op.add_column(
            sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column(
                "cancel_at_period_end",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            )
        )
        batch_op.add_column(sa.Column("trial_end", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index(
            "ix_subscriptions_provider_subscription_id", ["provider_subscription_id"]
        )
        batch_op.create_index(
            "ix_subscriptions_provider_customer_id", ["provider_customer_id"]
        )

    op.create_table(
        "webhook_events",
        sa.Column("event_id", sa.String(), primary_key=True),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("webhook_events")

    with op.batch_alter_table("subscriptions") as batch_op:
        batch_op.drop_index("ix_subscriptions_provider_customer_id")
        batch_op.drop_index("ix_subscriptions_provider_subscription_id")
        batch_op.drop_column("trial_end")
        batch_op.drop_column("cancel_at_period_end")
        batch_op.drop_column("current_period_end")
        batch_op.drop_column("current_period_start")
        batch_op.drop_column("amount_cents")
        batch_op.drop_column("plan_type")
        batch_op.drop_column("stripe_price_id")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_stripe_customer_id")
        batch_op.drop_column("stripe_customer_id")
