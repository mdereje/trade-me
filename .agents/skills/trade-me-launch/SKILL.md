---
name: trade-me-launch
description: >-
  Launch runbook, readiness audit, and billing architecture for Trade Me.
  Use when preparing Trade Me for live launch, fixing launch blockers, wiring
  stubbed backend/frontend flows, implementing $0.99/mo or $10/yr Stripe
  subscriptions, or deploying to Firebase Hosting and Cloud Run.
---

# Trade Me — Launch Runbook

**Trade Me** is a local barter platform where users trade everyday items without exchanging money. Browsing and listing 1 active item are free; unlimited listings and trading require a **$0.99/month** or **$10/year** Stripe membership.

- **Stack**: React 19 + TypeScript + Tailwind v3 (`frontend/`) · FastAPI + SQLAlchemy + Alembic + PostgreSQL (`backend/`)
- **Target Infra**: Firebase Hosting (`trade-me-13f73`) + Cloud Run (`backend`, `us-central1`) + Cloud SQL PostgreSQL (`trade-me-db`) + Cloud Storage (`trade-me-13f73-uploads`)

## Current State Snapshot

All application code, migrations, Stripe billing, public browsing, and deployment configs are implemented across PRs #1–#5. Only **external cloud & Stripe account provisioning** remains to go live.

| Area | Status | Details |
| :--- | :--- | :--- |
| Auth & Security | **Ready (PR #1)** | `.env.gcp` purged; fail-closed `SECRET_KEY` & social OAuth; public profiles strip email/phone PII; CI enforces tests & lint |
| Backend API & DB | **Ready (PR #2)** | Alembic `0001`+`0002` + 10 seeded categories; JSON login; typed Pydantic v2 schemas; fixed `TradeService` & `ReviewService`; real `UserService` stats; GCS/local photo uploads; DB-backed SMS codes |
| Billing ($0.99/mo & $10/yr) | **Ready (PR #3)** | Stripe Checkout + Billing Portal + verified/idempotent webhooks; browse & 1st listing free; HTTP `402` gating on trade offers & listing #2+ |
| Frontend & Public Browsing | **Ready (PR #4)** | Centralized `api.ts`; live public `/items` + `/items/:id` browsing; wired `Dashboard`, `CreateItem`, `Trades`, `Profile`; `/pricing`, `/billing/success`, `/billing/cancel`, `UpgradeModal`, `/terms`, `/privacy`, `/safety` |
| Infra & CI/CD | **Code Ready (PR #5) · Awaiting Cloud Setup** | Fixed `firebase.json` rewrite order, `/api` prefix, Artifact Registry, Cloud Run migration job, `deploy-firebase.sh`; awaiting user setup of GCP/Firebase secrets, Cloud SQL/Storage, Stripe Product/Prices/Webhook, and GitHub Secrets |

## Disclosed References

Read the matching reference before executing tasks in that domain:

- **Remaining setup & audit history** → [`references/current-state-audit.md`](./references/current-state-audit.md)
- **$0.99/mo & $10/yr Stripe billing architecture** → [`references/billing-architecture.md`](./references/billing-architecture.md)
- **Firebase/Cloud Run provisioning & go-live smoke checklist** → [`references/deployment-runbook.md`](./references/deployment-runbook.md)

## Remaining Go-Live Steps (Human Account Setup + Smoke Check)

Read [`references/deployment-runbook.md`](./references/deployment-runbook.md) before running provisioning commands.

1. **Rotate Leaked Credentials**: Rotate the old `DB_PASSWORD` and `SECRET_KEY` that previously lived in `.env.gcp` if reused anywhere.
2. **Provision GCP Resources on `trade-me-13f73`**:
   - Create Artifact Registry Docker repo `trade-me` in `us-central1`.
   - Create Cloud SQL PostgreSQL instance `trade-me-db` (or confirm whether to reuse existing `quivo-db-instance` on `trade-me-13f73`), database `trademe`, and user `trademe_user`.
   - Create Cloud Storage bucket `gs://trade-me-13f73-uploads` with public read + Cloud Run SA `roles/storage.objectAdmin`.
3. **Configure Stripe (Test first, then Live)**:
   - Create Product **Trade Me Membership** with two recurring USD Prices: `$0.99/month` and `$10.00/year`.
   - Enable Stripe Customer Portal (plan switching + cancel at period end).
   - Register webhook endpoint `https://trade-me-13f73.web.app/api/payments/webhook/stripe` for `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.paid`, `invoice.payment_failed`.
4. **Add Secrets**:
   - **GCP Secret Manager**: `database-url`, `secret-key`, `stripe-secret-key`, `stripe-webhook-secret` (grant `roles/secretmanager.secretAccessor` to Cloud Run runtime SA).
   - **GitHub Repo Secrets**: `FIREBASE_SA_KEY`, `REACT_APP_STRIPE_PUBLISHABLE_KEY`.
   - **GitHub Repo Variables**: `STRIPE_PRICE_MONTHLY_ID`, `STRIPE_PRICE_ANNUAL_ID`.
5. **Merge PRs #1 → #5 into `main`** (triggers automated `deploy-backend.yml` migration + deploy and `deploy-frontend.yml` Hosting deploy).
6. **Verify Live**: Run every check in the Go-Live Smoke Verification Checklist in [`references/deployment-runbook.md`](./references/deployment-runbook.md).

**Done when**: Live `https://trade-me-13f73.web.app` passes all smoke checks (health, public browse, auth, photo upload, Stripe checkout + webhook, trade lifecycle, billing portal) with clean Cloud Run logs.
