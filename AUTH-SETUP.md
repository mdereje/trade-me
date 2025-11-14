# Authentication Setup Guide

This guide walks you through configuring every authentication path supported by the Trade Me platform (email/password, Google, Facebook, Twitter, and phone verification).

## 1. Database Preparation

Registration now stores hashed passwords in the `password_hash` column on the `users` table. If your database was created before this change, add the column manually:

```sql
ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255);
```

If you are setting up a brand-new environment, re-running `Base.metadata.create_all` (during the first application start) will create the column automatically.

## 2. Environment Variables

Set the following variables locally (e.g. in `.env`) **and** on Cloud Run (`gcloud run services update`):

| Purpose            | Variable                                                         | Notes                                                                                                    |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| JWT signing        | `SECRET_KEY`                                                     | Use a long random string (32+ chars).                                                                    |
| JWT expiry         | `ACCESS_TOKEN_EXPIRE_MINUTES` (optional)                         | Defaults to 30 minutes.                                                                                  |
| Google OAuth       | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                       | Required to verify Google tokens. Obtain from Google Cloud Console (OAuth consent screen + credentials). |
| Facebook OAuth     | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`                   | Obtain from Facebook Developers console.                                                                 |
| Twitter OAuth      | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`                     | Obtain from Twitter/X developer portal.                                                                  |
| Twilio SMS         | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Required for real SMS verification. When unset, the app falls back to mock codes in the logs.            |
| Cloud Run Database | `DB_PASSWORD` (secret)                                           | Already used for deployments; required for email/password login.                                         |

> **Tip:** When running locally, place these values inside `backend/.env` (ensure `python-dotenv` loads them). In Cloud Run, set them via `gcloud run services update trade-me-backend --set-env-vars`.

## 3. Email + Password Registration

- The `/api/auth/register` endpoint now requires a password unless a social provider ID is supplied.
- The endpoint returns `{ access_token, token_type, user }` so the frontend can store the token immediately.
- Ensure the frontend sends snake_case fields (`full_name`, `phone_number`, etc.). This is already handled in `AuthContext`.

## 4. Google Sign-In

1. Configure an OAuth client (Web application) in the Google Cloud Console.
2. Add your frontend origin (`https://storage.googleapis.com/<bucket>/app-v2.html`) and redirect URI.
3. On the frontend, obtain a Google ID token after the user signs in (e.g. via Google Identity Services).
4. POST the token to `/api/auth/google`:

   ```http
   POST /api/auth/google
   Content-Type: application/json

   { "google_token": "<ID_TOKEN_FROM_GOOGLE>" }
   ```

5. The backend verifies the token, creates the account if needed, and returns an access token.

## 5. Facebook Login

1. Create an app in Facebook Developers and generate an App ID/Secret.
2. Add your deployment URL as a valid OAuth redirect.
3. Use Facebook SDK on the frontend to retrieve an access token.
4. POST the token to `/api/auth/facebook` to receive a JWT.

## 6. Twitter Login

1. Create a project/app on the Twitter/X developer portal and enable OAuth 2.0.
2. Implement the OAuth code exchange on the frontend (the current backend expects a bearer access token).
3. POST the access token to `/api/auth/twitter`.
   - The current implementation mocks verification if `TWITTER_CLIENT_ID` is not set; once credentials are provided, replace the verification logic with a real API call.

## 7. Phone Verification (Twilio)

1. Set the Twilio variables mentioned in the table above.
2. To send a code: `POST /api/auth/send-verification` with `phone_number`.
3. To verify: `POST /api/auth/verify-phone` with `phone_number` and `verification_code`.
4. In development (without Twilio credentials), mock codes are printed to the console/logs.
5. For production, replace the in-memory `verification_codes` store with Redis or another persistent cache.

## 8. Frontend Integration Checklist

- Update the registration form to call the appropriate backend endpoint (already wired in `AuthContext`).
- Implement Google/Facebook/Twitter login buttons that obtain provider tokens and call the corresponding backend endpoints.
- Store the returned `access_token` in `localStorage` (already handled).
- Protect routes by checking `authToken` and, ideally, validating it by calling a `/me` endpoint (to be implemented).

## 9. Testing the Flow

1. **Local**: Run the backend (`uvicorn main:app --reload`) and frontend (`npm start`). Use the mock provider flows (no env vars set) and inspect console logs for mock SMS codes.
2. **Integration**: After configuring real provider secrets, trigger the GitHub Actions workflow (push/PR). Tests will run automatically; merges to `main` will deploy with the configured secrets.
3. **Post-Deployment**: Visit the deployed frontend (`app-v2.html`) and test email registration, social login, and phone verification sequentially.

## 10. Common Pitfalls

- Missing `password_hash` column: run the SQL above before testing email login.
- OAuth redirect mismatches: ensure the exact frontend URL is registered with each provider.
- CORS errors: add your deployed frontend URL to the `CORS_ORIGINS` env var in Cloud Run (`https://storage.googleapis.com/<bucket>/app-v2.html`).
- Twilio SMS in production: verify the sender number is approved and the account is upgraded beyond trial to reach any phone number.

With these steps and environment variables in place, all authentication methods will function end-to-end in both local and deployed environments.
