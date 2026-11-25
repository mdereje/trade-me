# Trade Me — Deployment & Go-Live Runbook

Target Firebase / GCP Project: **`trade-me-13f73`** · Region: **`us-central1`** · Cloud SQL Instance: **`trade-me-db`** · Cloud Run Service: **`backend`** · Live URL: **`https://trade-me-13f73.web.app`**

## 1. Mandatory Config & CI Fixes Before Deploying

### Fix `firebase.json` Rewrite Ordering
Firebase Hosting evaluates rewrites top-to-bottom. Move `/api/**` **above** `**` so API calls reach Cloud Run instead of returning `index.html`:

```json
"rewrites": [
  {
    "source": "/api/**",
    "run": {
      "serviceId": "backend",
      "region": "us-central1"
    }
  },
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

### Fix Double `/api/api/...` URL Prefix
- Backend routes already mount under `/api/...` (`backend/main.py` lines 52–57).
- Frontend calls paths starting with `/api/...`.
- Therefore, in production (served behind Firebase Hosting rewrites), set `REACT_APP_API_URL=` (empty string, NOT `/api`) in `.github/workflows/deploy-frontend.yml`, and make `api.ts` default to `""` in production or `http://localhost:8000` in development. Result: browser requests `https://trade-me-13f73.web.app/api/auth/login` → Firebase rewrites to Cloud Run `/api/auth/login` (same-origin, zero CORS friction).

### Fix CI Workflows
- `.github/workflows/test.yml`:
  - Remove `|| echo "Tests completed"` from pytest step.
  - Remove `|| echo "Linting completed"` from ESLint step.
  - Ensure `frontend/package-lock.json` exists or point cache path to root `package-lock.json` (`npm ci` fails if lockfile is missing inside `frontend/`).
- `.github/workflows/deploy-backend.yml`:
  - Migrate image registry from deprecated `gcr.io/${PROJECT_ID}/backend` to Artifact Registry `us-central1-docker.pkg.dev/${PROJECT_ID}/trade-me/backend`.
  - Pass Stripe & Cloud Storage secrets in `--set-secrets` and non-secret Stripe Price IDs + `GCS_BUCKET_NAME` in `--set-env-vars`.
  - Require `test.yml` to pass (or run tests prior to deploy) before deploying `main`.
- `deploy-firebase.sh`:
  - Add `--add-cloudsql-instances ${PROJECT_ID}:us-central1:trade-me-db` and `FIREBASE_PROJECT_ID=${PROJECT_ID}` to match `deploy-backend.yml`, plus new Stripe/GCS secrets.
- **Prune obsolete files** once Firebase deployment is verified: `.env.gcp` (rotate first!), `cloudbuild.yaml`, `backend/cloudbuild.yaml`, `backend/app.yaml`, `backend/service.yaml`, `frontend/cloudbuild.yaml`, `frontend/Dockerfile`, `frontend/nginx.conf`, `firebase-data-connect-config.yaml`.

## 2. Production Infrastructure Provisioning (`trade-me-13f73`)

### 2.1 Enable GCP APIs & Artifact Registry
```bash
PROJECT_ID="trade-me-13f73"
gcloud config set project $PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com

gcloud artifacts repositories create trade-me \
  --repository-format=docker \
  --location=us-central1
```

### 2.2 Cloud SQL PostgreSQL
```bash
gcloud sql instances create trade-me-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --backup-start-time=03:00

gcloud sql databases create trademe --instance=trade-me-db
gcloud sql users create trademe_user --instance=trade-me-db --password="<STRONG_RANDOM_PASSWORD>"
```
> Note: `db-f1-micro` costs ~$9–15/mo continuously. For lower fixed burn at initial launch, serverless Postgres (Neon / Supabase) is a drop-in `DATABASE_URL` alternative requiring zero Cloud SQL proxy config.

### 2.3 Cloud Storage Bucket (Item Photos)
```bash
gsutil mb -l us-central1 gs://trade-me-13f73-uploads
# Configure public read for item images (or serve via signed URLs) and CORS for browser uploads
```
Grant the Cloud Run runtime service account `roles/storage.objectAdmin` on this bucket.

### 2.4 Secret Manager Secrets
Create and grant `roles/secretmanager.secretAccessor` to the Cloud Run service account for:
- `database-url`: `postgresql://trademe_user:<PASS>@/trademe?host=/cloudsql/trade-me-13f73:us-central1:trade-me-db`
- `secret-key`: 64-byte random hex (`openssl rand -hex 32`)
- `stripe-secret-key`: `sk_live_...` (use `sk_test_...` for staging)
- `stripe-webhook-secret`: `whsec_...` (from Stripe webhook endpoint registration)
- Optional (only if enabled): `google-client-id`, `google-client-secret`, `twilio-account-sid`, `twilio-auth-token`, `twilio-phone-number`

Non-secret Cloud Run env vars:
- `ENV=production`
- `FIREBASE_PROJECT_ID=trade-me-13f73`
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=60`
- `FRONTEND_URL=https://trade-me-13f73.web.app`
- `GCS_BUCKET_NAME=trade-me-13f73-uploads`
- `STRIPE_PRICE_MONTHLY_ID=price_...`
- `STRIPE_PRICE_ANNUAL_ID=price_...`

### 2.5 GitHub Actions Secrets
Ensure these exist under Repo Settings → Secrets → Actions:
- `FIREBASE_SA_KEY` (service account JSON with Cloud Run Admin, Artifact Registry Writer, Service Account User, Secret Manager Secret Accessor, Cloud SQL Client, Firebase Hosting Admin)
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`)
- Optional: `REACT_APP_GOOGLE_CLIENT_ID`

### 2.6 Database Migrations & Seeding
Run Alembic via a Cloud Run Job before routing live traffic:
```bash
gcloud run jobs create migrate-db \
  --image us-central1-docker.pkg.dev/trade-me-13f73/trade-me/backend:latest \
  --region us-central1 \
  --add-cloudsql-instances trade-me-13f73:us-central1:trade-me-db \
  --set-secrets DATABASE_URL=database-url:latest \
  --command alembic \
  --args upgrade,head

gcloud run jobs execute migrate-db --region us-central1 --wait
```

### 2.7 Custom Domain & Legal Readiness
- Connect custom domain in Firebase Hosting (automatic SSL) and add it to `CORS_ORIGINS` and `FRONTEND_URL`.
- Publish `/terms`, `/privacy`, and `/safety` pages before activating Stripe Live Mode (Stripe reviews live accounts for legal/contact info).
- Configure Cloud Monitoring uptime check on `https://trade-me-13f73.web.app/api/health` (note: expose `/api/health` in addition to `/health` so it works through Firebase Hosting rewrites) and error alerting.

## 3. Go-Live Smoke Verification Checklist

Run every check against `https://trade-me-13f73.web.app` before announcing launch:

- [ ] `GET /api/items/categories` returns seeded categories (proves Firebase Hosting → Cloud Run → Cloud SQL chain works)
- [ ] Email registration & login succeed; page reload preserves authenticated session via `/api/users/me`
- [ ] Unsubscribed user can browse items, and receives paywall prompt (`402`) on gated trade offer action
- [ ] Stripe Checkout completes for `$0.99/mo` and `$10/yr`; webhook logs `200 OK` in Stripe Dashboard and DB `subscriptions.status == 'active'`
- [ ] Item creation with real photo uploads persists images to Cloud Storage and renders on `/items` and `/items/:id`
- [ ] Two test accounts complete full trade lifecycle: offer → counter/accept → complete → leave review → profile stats update
- [ ] Stripe Customer Portal opens from `/profile`, allows switching Monthly ↔ Annual and canceling at period end
- [ ] Public `GET /api/users/{id}` response contains zero private PII (`email`, `phone_number`)
- [ ] Cloud Run logs show zero unhandled 500s or startup warnings
