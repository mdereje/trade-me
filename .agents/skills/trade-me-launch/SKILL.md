---
name: trade-me-launch
description: >-
  Launch runbook, readiness audit, and billing architecture for Trade Me.
  Use when preparing Trade Me for live launch, fixing launch blockers, wiring
  stubbed backend/frontend flows, implementing $0.99/mo or $10/yr Stripe
  subscriptions, or deploying to Firebase Hosting and Cloud Run.
---

# Trade Me — Launch Runbook

**Trade Me** is a local barter platform where users trade everyday items without exchanging money, funded by a membership subscription (**$0.99/month** or **$10/year**, replacing the prototype's `$1/week` placeholder).

- **Stack**: React 19 + TypeScript + Tailwind (`frontend/`) · FastAPI + SQLAlchemy + PostgreSQL (`backend/`)
- **Target Infra**: Firebase Hosting (`trade-me-13f73`) + Cloud Run (`backend`, `us-central1`) + Cloud SQL PostgreSQL (`trade-me-db`) + Cloud Storage (item photos)

## Current State Snapshot

The repo is an **early prototype / UI scaffold** — not launch-ready. Core flows are mocked or disconnected.

| Area | Status | Primary Gaps |
| :--- | :--- | :--- |
| Auth & Security | **Broken / Unsafe** | `.env.gcp` leaks credentials in git; mock OAuth logs anyone in when env vars unset; login expects query params instead of JSON; `validateToken` is a no-op |
| Backend API & DB | **Partial / Buggy** | No Alembic migrations or category seed; Pydantic `dict` schemas clash with ORM objects; `TradeService` sets `item_owner_id=item_id` and assigns raw strings to Enums; photo upload & user stats are stubs |
| Billing ($0.99/mo & $10/yr) | **Mocked** | `PaymentService` inserts fake rows; webhooks unverified; hardcoded `$1/week`; zero subscription gating on endpoints |
| Frontend Pages | **UI Mockup** | Only `/register` calls the real API; `Dashboard`, `Items`, `ItemDetail`, `CreateItem`, `Trades`, `Profile` use hardcoded mocks or no-op buttons; no `src/services/` API layer or pricing/checkout UI |
| Infra & CI/CD | **Misconfigured** | `firebase.json` matches `**` before `/api/**`; prod `REACT_APP_API_URL=/api` causes `/api/api/...` double prefix; `test.yml` swallows pytest/lint failures; local photo disk is ephemeral on Cloud Run |

## Disclosed References

Read the matching reference before editing code in that domain:

- **Bug, security, and mock inventory** → [`references/current-state-audit.md`](./references/current-state-audit.md) — read before fixing backend/frontend defects or wiring pages.
- **$0.99/mo & $10/yr Stripe billing architecture** → [`references/billing-architecture.md`](./references/billing-architecture.md) — read before implementing payments, webhooks, paywall gating, or pricing UI.
- **Firebase/Cloud Run deployment & go-live checklist** → [`references/deployment-runbook.md`](./references/deployment-runbook.md) — read before fixing hosting rewrites, CI/CD, secrets, storage, or deploying live.

## Launch Execution Phases

Work through phases in order. Keep each phase's completion criterion satisfied before moving on, and update the snapshot above plus `references/current-state-audit.md` as blockers close so this skill stays current.

### Phase 1 — Security & Repo Hygiene

Read [`references/current-state-audit.md`](./references/current-state-audit.md) (Security section).

1. Rotate exposed `DB_PASSWORD` and `SECRET_KEY` from `.env.gcp`, remove `.env.gcp` from git tracking, and add `.env.*` to `.gitignore`.
2. Fail closed on startup if `SECRET_KEY` is missing/default outside tests; remove development mock fallbacks from `backend/app/utils/social_auth.py` (gate behind explicit `ENV=development` or disable unconfigured providers with HTTP 501).
3. Remove `|| echo` failure-swallowing in `.github/workflows/test.yml` so CI blocks on failing tests and lint errors.
4. Strip private fields (`email`, `phone_number`) from public `UserProfile` responses (`GET /api/users/{user_id}` and `GET /api/users/`).

**Done when**: No secrets remain in git history/working tree, unconfigured OAuth/JWT fail closed, public user endpoints omit PII, and CI fails red on broken tests.

### Phase 2 — Backend Core, Migrations & Media Storage

Read [`references/current-state-audit.md`](./references/current-state-audit.md) (Backend section).

1. Initialize Alembic (`backend/alembic.ini`, `backend/alembic/`) with an initial migration covering all tables plus a seed migration for `item_categories` (Electronics, Furniture, Books, Clothing, Tools, Sports, Home & Garden, Other). Replace import-time `Base.metadata.create_all` in production paths.
2. Fix auth contracts: change `POST /api/auth/login` to accept a JSON `LoginRequest` body, return `{access_token, token_type, user}`, guard `password_hash is None` on social accounts, and return HTTP 400 on duplicate `username` or `phone_number`.
3. Fix Pydantic response schemas (`ItemResponse`, `TradeOfferResponse`, `TradeResponse`, `ReviewResponse`) to use typed nested summary schemas instead of `dict` so SQLAlchemy ORM objects serialize cleanly.
4. Fix `TradeService`: resolve `item_owner_id` from `Item.owner_id`, validate ownership of `offered_item_id`, block self-trades, use `TradeStatus`/`TradeOfferStatus` enum values consistently, and mark both items `ItemStatus.TRADED` on trade completion.
5. Implement real aggregate queries in `UserService.get_user_profile`, real validation in `ReviewService` (completed trade participant, rating 1–5, one review per participant per trade), and geographic filtering (`latitude`/`longitude`/`radius` Haversine) in `ItemService.get_items`.
6. Implement real photo uploads in `ItemService.upload_photos` backed by Google Cloud Storage / Firebase Storage (validate MIME type & size, persist `ItemPhoto` records, return public/signed URLs) rather than ephemeral Cloud Run local disk.
7. Move SMS verification codes out of process memory (`phone_verification.py`) into PostgreSQL (with expiry + attempt limits + rate limit) or disable phone verification until Twilio is provisioned.

**Done when**: `pytest` covers auth, items, photo uploads, offers/counter-offers/trades, reviews, and user profiles end-to-end against a clean migrated database with zero 500s or Pydantic validation errors.

### Phase 3 — Stripe Subscriptions ($0.99/mo & $10/yr)

Read [`references/billing-architecture.md`](./references/billing-architecture.md) in full before writing code.

1. Create Alembic migration updating `subscriptions` (`plan_type`, `stripe_price_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `trial_end`, `TRIALING` status), adding `stripe_customer_id` to `users`, and adding `webhook_events` for idempotency.
2. Implement Stripe Checkout Sessions (`POST /api/payments/checkout`), Stripe Customer Portal (`POST /api/payments/portal`), and live status (`GET /api/payments/status`) supporting `monthly` ($0.99/mo) and `annual` ($10/yr) Price IDs. Defer PayPal for MVP launch.
3. Replace mocked `/api/payments/webhook/stripe` with raw-body `stripe.Webhook.construct_event` signature verification and idempotent event handling (`checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`).
4. Add FastAPI dependency `require_active_subscription` (returns HTTP `402 Payment Required`) and apply it to gated actions (creating listings beyond free limit, making/accepting trade offers, contacting owners) while keeping item browsing free.

**Done when**: Stripe CLI webhook replay tests verify checkout → active entitlement → gated action allowed → payment failure/cancellation → HTTP 402 enforcement, and duplicate webhooks are idempotent.

### Phase 4 — Frontend Wiring, Cleanup & Pricing UX

Read [`references/current-state-audit.md`](./references/current-state-audit.md) (Frontend section) and [`references/billing-architecture.md`](./references/billing-architecture.md) (Frontend UX section).

1. Fix dependency/script mismatches: align Tailwind config/version (`tailwindcss` v4 vs CRA v3 setup), remove conflicting `@types/react-router-dom` v5, and add `"dev": "react-scripts start"` in `frontend/package.json` (or fix root `package.json`).
2. Create `frontend/src/services/api.ts` (Axios/fetch client with Bearer token interceptor, single `/api` base handling, snake_case/camelCase mapping, and `402` paywall handling).
3. Fix `AuthContext.tsx`: implement real `validateToken` via `GET /api/users/me`, remove hardcoded fake user in `login`, and expose `subscription` state. Hide or wire unimplemented social login buttons and "Forgot password".
4. Wire every page to real APIs via React Query: `Items` (search/category/location filters), `ItemDetail` (real data + Make Trade Offer modal), `CreateItem` (create item + multipart photo upload), `Dashboard` (real stats & recent activity), `Trades` (real offers/trades + Accept/Reject/Counter/Complete/Cancel + Leave Review modal), `Profile` (real edit form, reviews, subscription status + Manage Billing portal button).
5. Build `/pricing` (and paywall prompt modal) showcasing **$10/year (Best Value — Save 16%)** alongside **$0.99/month**, checkout return/cancel views, and replace all `$1/week` copy (`Home.tsx`, `Footer.tsx`, `Profile.tsx`, `README.md`).

**Done when**: `npm run build`, `npm run lint`, and `npm test` pass cleanly, and a user can register, browse, subscribe via Stripe test mode, list an item with photos, trade, and leave a review with zero mock data left on screen.

### Phase 5 — Infrastructure & Live Launch

Read [`references/deployment-runbook.md`](./references/deployment-runbook.md) in full before running deploy commands.

1. Fix `firebase.json` rewrite order (`/api/**` BEFORE `**`) and fix the double `/api/api/...` prefix between `deploy-frontend.yml` (`REACT_APP_API_URL=""` when using relative `/api/...` paths) and `api.ts`.
2. Fix `deploy-firebase.sh` (add `--add-cloudsql-instances`, `FIREBASE_PROJECT_ID`, Stripe/GCS secrets, Artifact Registry image path) and prune obsolete GCP config files (`cloudbuild.yaml`, `app.yaml`, `service.yaml`, `firebase-data-connect-config.yaml`).
3. Provision production resources on `trade-me-13f73`: Cloud SQL (`trade-me-db`), GCS bucket for uploads, Secret Manager secrets (`database-url`, `secret-key`, `stripe-secret-key`, `stripe-webhook-secret`, `stripe-price-monthly`, `stripe-price-annual`), and GitHub Actions secrets.
4. Run Alembic migrations + category seed against production Cloud SQL, deploy backend to Cloud Run and frontend to Firebase Hosting, and register the live Stripe webhook URL (`https://trade-me-13f73.web.app/api/payments/webhook/stripe`).
5. Execute the end-to-end production smoke checklist in [`references/deployment-runbook.md`](./references/deployment-runbook.md).

**Done when**: Live `https://trade-me-13f73.web.app` passes every smoke check (health, auth, item+photo upload, live/test $0.99 & $10 Stripe checkout + webhook, trade lifecycle, billing portal) with clean Cloud Run logs.
