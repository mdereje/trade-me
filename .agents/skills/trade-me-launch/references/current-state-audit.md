# Trade Me — Current State Audit

## Resolved in PRs #1–#5
- **PR #1 (Security & CI)**: Removed `.env.gcp`, expanded `.gitignore`, enforced fail-closed `SECRET_KEY` and OAuth providers, stripped private `email`/`phone_number` from public `/api/users/*` responses, and removed `|| echo` failure masking in `.github/workflows/test.yml`.
- **PR #2 (Backend Core & Migrations)**: Added Alembic (`0001_initial`) with 10 seeded categories, JSON `LoginRequest` returning `{access_token, token_type, user}`, duplicate username/phone validation, typed Pydantic v2 schemas, fixed `TradeService` FK/enum/ownership/completion bugs, live `UserService` stats, `ReviewService` validation, Haversine geo-filtering, GCS/local photo uploads, and DB-backed SMS verification codes.
- **PR #3 (Stripe Billing)**: Added Alembic `0002_stripe_billing` (`users.stripe_customer_id`, extended `subscriptions`, `webhook_events`), real Stripe Checkout (`$0.99/mo` & `$10/yr`), Billing Portal, verified/idempotent webhooks, and `require_active_subscription` HTTP `402` gating while keeping browsing and 1st listing free.
- **PR #4 (Frontend & Public Browsing)**: Fixed Tailwind v3 / router types / `dev` script, added `frontend/src/services/api.ts`, wired public `/items` + `/items/:id` browsing, `AuthContext`, `CreateItem`, `Dashboard`, `Trades`, `Profile`, `/pricing`, `/billing/success`, `/billing/cancel`, `UpgradeModal`, and `/terms`, `/privacy`, `/safety`.
- **PR #5 (Deployment & Live Readiness)**: Fixed `firebase.json` rewrite order (`/api/**` before `**`), fixed double `/api/api/...` prefix in `deploy-frontend.yml`, migrated `deploy-backend.yml` and `deploy-firebase.sh` to Artifact Registry + Alembic Cloud Run Job + Stripe/GCS secrets, and pruned legacy GCP config files.

## Remaining External Setup (Not Code Blockers)
Verified live against `trade-me-13f73` and GitHub (`mdereje/trade-me`):
1. **GitHub Actions Secrets & Variables**: Currently empty (`gh secret list` returned none). Add `FIREBASE_SA_KEY` + `REACT_APP_STRIPE_PUBLISHABLE_KEY` secrets and `STRIPE_PRICE_MONTHLY_ID` + `STRIPE_PRICE_ANNUAL_ID` repo variables.
2. **GCP Project `trade-me-13f73` Resources**:
   - Existing resources found on `trade-me-13f73`: Cloud Run services `trademe-api`, `trademe-agent`; Cloud SQL instance `quivo-db-instance` (`POSTGRES_16`); Secret Manager secrets `jwt-secret`, `postgres-db-url`.
   - Required for this repo's deployment (or align names if reusing existing): Artifact Registry repo `trade-me`, Cloud SQL instance `trade-me-db` (database `trademe`), Cloud Storage bucket `trade-me-13f73-uploads`, Secret Manager secrets `database-url`, `secret-key`, `stripe-secret-key`, `stripe-webhook-secret`.
3. **Stripe Dashboard**: Create `$0.99/mo` and `$10/yr` Prices, configure Billing Portal, and register webhook `https://trade-me-13f73.web.app/api/payments/webhook/stripe`.
4. **Optional Post-Launch Enhancements**: Password reset email flow, real Google/Facebook OAuth buttons, Twilio SMS UI, direct trader chat messaging.
