# Trade Me — Billing Architecture ($0.99/mo & $10/yr)

Design for replacing the mocked `$1/week` prototype with a production **$0.99/month** and **$10/year** subscription system.

## 1. Pricing & Payment Processor Economics

At sub-$1 price points, fixed per-transaction fees dominate margins. Design the checkout UX and processor choice around the real math:

| Plan | Gross Price | Stripe Card (`2.9% + $0.30`) + Billing (`0.7%`) | Est. Net Revenue | Effective Fee % |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly** | $0.99 / mo | ~$0.34 | **~$0.65 / mo** (~$7.80/yr) | **~34%** |
| **Annual** | $10.00 / yr | ~$0.66 | **~$9.34 / yr** | **~6.6%** |

### Key Economic Takeaways
1. **Use Stripe only for MVP; defer PayPal.** PayPal Standard (`3.49% + $0.49`) takes **~$0.52 (53%)** of a $0.99 payment and doubles webhook/reconciliation surface area. Stripe Checkout natively includes Cards, Apple Pay, Google Pay, and Link with zero PCI scope. (Revisit PayPal Micropayments `5% + $0.05` only if PayPal demand warrants a dedicated micropayments merchant account.)
2. **Default the UI to Annual ($10/year).** Annual saves the user 16% ($11.88 → $10.00) while increasing Trade Me's net revenue per subscriber by ~20% ($7.80 → $9.34) and eliminating 11 monthly renewal failure points per year. Highlight Annual as **"Best Value — Save 16%"** and pre-select it on `/pricing`.
3. **Protect against disputes.** A single $15 Stripe chargeback fee wipes out ~23 monthly subscribers. Always configure:
   - Recognizable statement descriptor (e.g., `TRADEME BARTER`)
   - One-click self-serve cancellation via **Stripe Customer Portal**
   - Automated Stripe email receipts and renewal reminders before annual renewals
   - Public Terms of Service, Refund Policy, and Privacy Policy links (required by Stripe)
4. **If a mobile app is built later:** Apple/Google Small Business Program (15% fee = $0.15 on $0.99) is actually cheaper than Stripe on $0.99 monthly, though web subscriptions stay on Stripe.

## 2. Marketplace Paywall Strategy (Avoiding Cold-Start Failure)

A local barter marketplace needs inventory density before users will pay. Hard-gating browsing behind a paywall kills signups.

### Recommended Entitlement Tiers
- **Free Account (No card required)**:
  - Browse and search all local listings
  - View item details and public trader ratings/reviews
  - Optional: list **1 active item** (so users invest effort before hitting the paywall)
- **Active Member ($0.99/mo or $10/yr)**:
  - Unlimited active item listings
  - Send, receive, accept, and counter trade offers
  - Contact/coordinate meetup details with trade partners
- **Launch Liquidity Lever**: Use Stripe Checkout **Promotion Codes** (`allow_promotion_codes=True`) or a **7-day / 30-day free trial** (`trial_period_days`) for early local cohorts so initial users can trade immediately and seed reviews.

## 3. Stripe Architecture (Hosted Checkout + Billing Portal + Webhooks)

Never collect raw card numbers or trust client-side subscription flags. Stripe is the single source of truth, synced to PostgreSQL via verified webhooks.

### Stripe Dashboard Setup (Test Mode first, then Live Mode)
1. Create one Stripe Product: **Trade Me Membership**
2. Create two recurring USD Prices under that product:
   - Monthly: `$0.99 / month` → store ID in `STRIPE_PRICE_MONTHLY_ID`
   - Annual: `$10.00 / year` → store ID in `STRIPE_PRICE_ANNUAL_ID`
3. Enable and configure **Stripe Customer Portal**:
   - Allow plan switching between Monthly and Annual (with proration)
   - Allow cancel at period end (retain access until `current_period_end`)
   - Allow payment method updates and invoice history downloads
4. Register webhook endpoint `https://trade-me-13f73.web.app/api/payments/webhook/stripe` for events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

### Data Model Changes (Alembic Migration)

Update `users`:
- `stripe_customer_id: String, unique=True, index=True, nullable=True`

Update `subscriptions` (`backend/app/models/subscription.py`):
- Extend `SubscriptionStatus` enum: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELLED`, `INCOMPLETE`, `UNPAID`
- Keep `user_id` unique (upsert on re-subscribe instead of inserting duplicate rows)
- Add columns:
  - `plan_type: String` (`"monthly"` | `"annual"`)
  - `stripe_price_id: String`
  - `amount_cents: Integer` (`99` or `1000` — avoid float currency rounding)
  - `current_period_start: DateTime(timezone=True)`
  - `current_period_end: DateTime(timezone=True)`
  - `cancel_at_period_end: Boolean, default=False`
  - `trial_end: DateTime(timezone=True), nullable=True`
- Remove hardcoded `$1.0 / weekly` defaults.

Add `webhook_events` table (idempotency):
- `event_id: String, primary_key=True` (Stripe `evt_...` ID)
- `event_type: String, nullable=False`
- `processed_at: DateTime(timezone=True), server_default=func.now()`

## 4. Backend API Design (`backend/app/routers/payments.py`)

| Endpoint | Auth | Behavior |
| :--- | :--- | :--- |
| `GET /api/payments/plans` | Public | Returns `{monthly: {price_cents: 99, interval: "month"}, annual: {price_cents: 1000, interval: "year", savings_percent: 16}}` |
| `POST /api/payments/checkout` | JWT | Body: `{plan: "monthly" \| "annual"}`. Lazily creates/reuses `user.stripe_customer_id`, blocks if already active (directs to portal instead), creates Stripe Checkout Session (`mode="subscription"`, `allow_promotion_codes=True`, `client_reference_id=str(user.id)`, `metadata={user_id, plan}`), returns `{checkout_url}`. |
| `POST /api/payments/portal` | JWT | Creates Stripe Billing Portal session for `user.stripe_customer_id`, returns `{portal_url}` for switching plans, updating cards, or canceling. |
| `GET /api/payments/status` | JWT | Returns normalized entitlement `{is_active, status, plan_type, amount_cents, current_period_end, cancel_at_period_end, trial_end}` (returns `{is_active: false, status: "none"}` instead of 404 when unsubscribed so frontend handles cleanly). |
| `POST /api/payments/webhook/stripe` | Stripe Signature | Reads raw `await request.body()` + `Stripe-Signature` header, verifies with `stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)`, checks `webhook_events` for duplicate `event.id`, upserts `Subscription` state inside a DB transaction, commits `webhook_events` row, returns `200`. |

### Entitlement Guard Dependency (`backend/app/utils/auth.py`)

```python
def require_active_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    now = datetime.now(timezone.utc)
    if (
        not sub
        or sub.status not in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING)
        or (sub.current_period_end and sub.current_period_end < now)
    ):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail={
                "code": "SUBSCRIPTION_REQUIRED",
                "message": "An active Trade Me membership ($0.99/mo or $10/yr) is required for this action.",
                "pricing_url": "/pricing",
            },
        )
    return current_user
```

Apply `Depends(require_active_subscription)` to:
- `POST /api/trades/offers`
- `POST /api/trades/offers/{offer_id}/accept`
- `POST /api/trades/offers/{offer_id}/counter`
- `POST /api/items` (or allow 1 free active item and enforce on item #2+)

## 5. Frontend Billing UX

1. **Pricing Page (`/pricing`)**:
   - Two clear cards side-by-side:
     - **Annual — $10/year** (pre-selected, badge: *"Best Value · Save 16% · Just $0.83/mo"*)
     - **Monthly — $0.99/month** (*"Flexible · Cancel anytime"*)
   - Clicking Subscribe calls `POST /api/payments/checkout` and redirects browser to `checkout_url`.
   - If not logged in, redirect to `/register?redirect=/pricing`.
2. **Checkout Return Routes**:
   - `/billing/success?session_id=...` — polls `GET /api/payments/status` until `is_active: true` (handles webhook race condition gracefully with a short loading state) then routes to `/dashboard`.
   - `/billing/cancel` — friendly message returning user to `/pricing`.
3. **Global `402` Paywall Interceptor**:
   - In `frontend/src/services/api.ts`, intercept HTTP `402` with `code === "SUBSCRIPTION_REQUIRED"` and open a modal showing the `$0.99/mo` and `$10/yr` upgrade options.
4. **Profile Subscription Card (`Profile.tsx`)**:
   - Render real plan (`$0.99/month` or `$10/year`), status badge (`Active`, `Trialing`, `Cancels on <date>`, `Past Due`, `Free`), next renewal date, and wire **"Manage Subscription"** to `POST /api/payments/portal` (or **"Upgrade"** to `/pricing` if unsubscribed).
5. **Copy Cleanup**:
   - Replace every `"$1/week"` string in `Home.tsx`, `Footer.tsx`, `Profile.tsx`, and `README.md` with `"$0.99/month or $10/year"`.

## 6. Verification with Stripe CLI

```bash
# Forward local webhooks during development
stripe listen --forward-to http://localhost:8000/api/payments/webhook/stripe

# Trigger test lifecycle events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

Confirm:
1. Unsubscribed user receives `402` on `POST /api/trades/offers`.
2. Completing Checkout in Stripe test mode (`4242...`) creates/updates `subscriptions` row with `status=active` and valid `current_period_end`.
3. Gated endpoint succeeds immediately after webhook processes.
4. Re-sending the same webhook event ID is a safe no-op (`200 OK`, no duplicate rows).
5. Canceling in Billing Portal sets `cancel_at_period_end=true` while preserving access until `current_period_end`, then revokes access when `customer.subscription.deleted` fires.
