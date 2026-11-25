# Trade Me — Current State Audit

Detailed inventory of defects, mocks, and missing functionality verified directly against the repository. Remove items here as they are resolved.

## 1. Security & Secrets Blockers

- **Leaked credentials in git** — `.env.gcp` is tracked in git and contains `DB_PASSWORD` and `SECRET_KEY` (for older project `trade-me-476221`). Rotate immediately, untrack, and ignore `.env.*` in `.gitignore`.
- **Default JWT secret** — `backend/app/utils/security.py` and `backend/app/utils/auth.py` fall back to `"your-secret-key-here"` when `SECRET_KEY` is unset. Fail fast on startup outside test mode instead.
- **Auth bypass via OAuth mock fallbacks** — `backend/app/utils/social_auth.py` returns hardcoded mock user dicts (`user@gmail.com`, `user@facebook.com`, `user@twitter.com`) whenever `GOOGLE_CLIENT_ID` / `FACEBOOK_CLIENT_ID` / `TWITTER_CLIENT_ID` is unset. Any token grants access to those accounts in production unless env vars are set. Twitter production verification is also unimplemented (`return None`).
- **Unverified payment webhooks** — `backend/app/routers/payments.py` accepts parsed `dict` bodies for `/webhook/stripe` and `/webhook/paypal` with no signature check; `PaymentService` unconditionally returns `True`.
- **Public PII exposure** — `GET /api/users/{user_id}` and `GET /api/users/` (`backend/app/routers/users.py`) return `UserProfile`, which inherits `email` and `phone_number` from `UserBase`. Split `PublicUserProfile` (no email/phone) from `PrivateUserProfile` (`/me`).
- **Ephemeral, unthrottled SMS codes** — `backend/app/utils/phone_verification.py` stores codes in a process-local dict `verification_codes = {}` with no expiration, attempt limit, or rate limit. Breaks on multi-instance Cloud Run and allows brute forcing.

## 2. Backend Defects & Stubs

### Database & Migrations
- **No Alembic setup**: `alembic` is in `backend/requirements.txt` and referenced in docs, but `alembic.ini` and `alembic/` do not exist. `backend/main.py` calls `Base.metadata.create_all(bind=engine)` at import time.
- **Empty `item_categories` table**: No seed script or migration populates categories, so `POST /api/items` fails its foreign key check on a fresh database.
- **Legacy schema mismatch risk**: `AUTH-SETUP.md` notes `users.password_hash` was added after initial table creation; ensure migrations handle existing databases cleanly.

### Auth (`backend/app/routers/auth.py`, `backend/app/services/auth_service.py`)
- **Login parameter mismatch**: `POST /api/auth/login` declares `email: str, password: str` as bare function parameters (FastAPI reads them from query strings), whereas `frontend/src/contexts/AuthContext.tsx` POSTs a JSON body `{ email, password }` → always returns `422 Unprocessable Entity`.
- **Login omits user object**: `/api/auth/login` returns only `{access_token, token_type}`, unlike `/api/auth/register` which also returns `user`.
- **Social user password crash**: `AuthService.authenticate_user` calls `verify_password(password, user.password_hash)` without checking `if not user.password_hash`, crashing on social-only users.
- **Unhandled duplicate constraints**: `/api/auth/register` checks duplicate `email` but not duplicate `username` or `phone_number` → `500 IntegrityError`.
- **Missing flows**: No password reset, email verification, or refresh token / token revocation.

### Serialization (`backend/app/schemas/*.py`)
- **ORM-to-`dict` validation failures**: `ItemResponse.owner`, `TradeOfferResponse.{item, offered_item, offerer, item_owner}`, `TradeResponse.{item1, item2, user1, user2}`, and `ReviewResponse.{reviewer, reviewee}` are typed as `dict`, while SQLAlchemy relationships return ORM model instances. Pydantic v2 `from_attributes=True` fails to validate ORM instances as `dict`. Replace with typed nested summary Pydantic models (e.g., `UserSummary`, `ItemSummary`).

### Items (`backend/app/services/item_service.py`, `backend/app/schemas/item.py`)
- **Stubbed photo uploads**: `ItemService.upload_photos` contains `# TODO: Implement actual photo upload` and returns `True` without saving files or `ItemPhoto` rows. Local `static/uploads` will also be lost on Cloud Run container restarts — must use Cloud Storage / Firebase Storage.
- **Ignored photos on create**: `ItemCreate` requires `photos: List[ItemPhotoCreate]`, but `ItemService.create_item` ignores `item_data.photos`. Make `photos` optional on create or upload photos after item creation via `POST /api/items/{id}/photos`.
- **Ignored geo-search params**: `ItemService.get_items` accepts `radius`, `latitude`, `longitude` and never filters by them.
- **No status filter**: `get_items` filters `is_visible == True` but does not exclude `ItemStatus.TRADED` or `ItemStatus.ARCHIVED`.

### Trades (`backend/app/services/trade_service.py`)
- **Wrong foreign key on offer creation (line 15)**: `item_owner_id=offer_data.item_id` assigns the *item ID* instead of querying `Item.owner_id`!
- **Raw strings assigned to Enum columns**: Lines 53, 57, 69, 89, 97, 107 assign/filter raw strings (`"accepted"`, `"rejected"`, `"completed"`, `"cancelled"`, `"pending"`) against SQLAlchemy `Enum(TradeStatus)` / `Enum(TradeOfferStatus)` columns instead of enum members.
- **Missing integrity checks**: Does not verify `offered_item_id` belongs to `offerer_id`, does not block offering on your own item, does not reject offers on already-traded items, does not transition both items to `ItemStatus.TRADED` when `complete_trade` runs, and does not check authorization in `get_counter_offers`.

### Users & Reviews (`user_service.py`, `review_service.py`)
- **Mocked profile stats**: `UserService.get_user_profile` hardcodes `items_count=0`, `trades_completed=0`, `average_rating=0.0`, `reviews_count=0`.
- **Unvalidated reviews**: `ReviewService.create_review` allows reviewing any user/trade without checking trade existence, `TradeStatus.COMPLETED`, participant membership, rating bounds (1–5), or duplicate reviews.

### Payments (`backend/app/services/payment_service.py`, `backend/app/models/subscription.py`)
- **100% mocked**: Inserts hardcoded `sub_mock_123` / `sub_mock_456`, never calls Stripe or PayPal SDKs.
- **Outdated pricing**: Hardcoded to `$1.00 / weekly` instead of `$0.99/month` and `$10/year`.
- **No gating**: Zero endpoints check subscription status.
- **Re-subscribe bug**: `subscriptions.user_id` has `unique=True`; creating a new row after cancellation raises an integrity error unless updated/upserted.

## 3. Frontend Defects & Unwired Pages

### Tooling & Dependencies (`package.json`, `frontend/package.json`)
- **Broken root dev script**: Root `package.json` runs `cd frontend && npm run dev`, but `frontend/package.json` only defines `"start"`.
- **Tailwind version mismatch**: `frontend/package.json` installs `tailwindcss@^4.1.16`, while `frontend/postcss.config.js`, `frontend/tailwind.config.js`, and `frontend/src/index.css` (`@tailwind base/components/utilities`) use Tailwind v3 syntax under CRA (`react-scripts@5.0.1`). Verify build output and pin Tailwind v3 (`^3.4.x`) or migrate PostCSS config properly.
- **Conflicting router types**: Installs both `react-router-dom@^7.9.4` (ships own TS types) and `@types/react-router-dom@^5.3.3`. Remove `@types/react-router-dom`.
- **Missing API service layer**: `frontend/src/services/` does not exist.

### Page-by-Page Status
- **`AuthContext.tsx`**: `validateToken` is a no-op (page reload loses session state); `login` hardcodes fake user `{ id: 1, fullName: 'User' }` and posts JSON to a query-param backend endpoint; `register` works structurally but does not surface backend `detail` error messages.
- **`Home.tsx` & `Footer.tsx`**: Hardcoded `"$1/week"` pricing copy and `© 2024`; footer legal/support buttons (`Help Center`, `Terms of Service`, `Privacy Policy`, `Cookie Policy`, `Contact Us`) are unlinked `<button>` stubs.
- **`Login.tsx` & `Register.tsx`**: Social OAuth buttons only `console.log`; "Forgot your password?" is a `<button>` inside the form with no `type="button"` (triggers form submit!).
- **`Dashboard.tsx`**: Hardcoded `0` stats and static empty states; zero API calls.
- **`Items.tsx`**: Hardcoded categories and `const items: any[] = []`; "Apply Filters" button and Sort dropdown have no handlers; zero API calls.
- **`ItemDetail.tsx`**: Hardcoded "Vintage Wooden Chair" / "John Doe" mock with broken `/api/placeholder/400/300` URLs; "Make Trade Offer" and "Contact Owner" buttons do nothing.
- **`CreateItem.tsx`**: `onSubmit` logs to console and redirects to `/dashboard`; `URL.createObjectURL(photo)` previews are never revoked; zero API calls.
- **`Trades.tsx`**: Hardcoded mock offers/trades; Accept, Reject, Counter Offer, Complete Trade, and Cancel Trade buttons have no handlers.
- **`Profile.tsx`**: Hardcoded stats, mock reviews, and `"$1/week"` subscription box; `Edit` toggles `isEditing` with no edit form rendered; Quick Actions and "Manage Subscription" buttons have no handlers.
- **Missing pages/flows**: No `/pricing` or Checkout page, no paywall modal, no phone verification UI, no review submission form, no user messaging/contact mechanism, and no legal pages (Terms/Privacy — required by Stripe).

## 4. Infrastructure & CI/CD Defects

- **`firebase.json` rewrite order bug**: `"source": "**"` appears *before* `"source": "/api/**"`, shadowing the Cloud Run rewrite so all `/api/**` calls return `index.html`.
- **Double `/api/api/...` prefix bug**: `.github/workflows/deploy-frontend.yml` sets `REACT_APP_API_URL=/api`, and `AuthContext.tsx` calls `buildApiUrl('/api/auth/login')`, producing `/api/api/auth/login`.
- **CI masks failures**: `.github/workflows/test.yml` appends `|| echo "Tests completed"` to `pytest` and `|| echo "Linting completed"` to `npm run lint`.
- **Test coverage is minimal**: Backend has only 3 tests (`/`, `/health`, `OPTIONS /`); frontend has only a render smoke test mocking `react-router-dom`.
- **`deploy-firebase.sh` drift**: Missing `--add-cloudsql-instances` and `FIREBASE_PROJECT_ID` env var (present in `deploy-backend.yml`); pushes to deprecated `gcr.io`.
- **Unused legacy config clutter**: `cloudbuild.yaml`, `backend/cloudbuild.yaml`, `backend/app.yaml`, `backend/service.yaml`, `frontend/cloudbuild.yaml`, `frontend/Dockerfile`, `frontend/nginx.conf`, and non-standard `firebase-data-connect-config.yaml` remain in the repo.
