# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automated testing and deployment of the Trade Me application.

## Required GitHub Secrets

To enable automated deployment, you need to configure the following secrets in your GitHub repository:

### 1. Firebase Service Account Key (Required)

- **Secret Name**: `FIREBASE_SA_KEY`
- **Description**: JSON key for Firebase/Google Cloud Service Account with deployment permissions (required for GitHub Actions deployment)
- **How to get it**:
  1. Go to [Firebase Console](https://console.firebase.google.com/)
  2. Navigate to Project Settings > Service Accounts
  3. Click "Generate new private key"
  4. Copy the entire JSON content and paste it as the secret value
  5. Ensure the service account has these roles:
     - Cloud Run Admin
     - Service Account User
     - Secret Manager Secret Accessor
     - Cloud SQL Client

### 2. Database Password

- **Secret Name**: `DB_PASSWORD`
- **Description**: Password for the PostgreSQL database user
- **Value**: The password you set for the `trademe_user` database user

### 3. Application Secrets

- **Secret Name**: `SECRET_KEY`
- **Description**: JWT signing key for the application
- **Value**: Generate a secure random string (32+ characters)

### 4. Payment Provider Keys (Optional)

- **Secret Name**: `STRIPE_SECRET_KEY`
- **Description**: Stripe secret key for payment processing
- **Value**: Your Stripe secret key (starts with `sk_`)

- **Secret Name**: `PAYPAL_CLIENT_ID`
- **Description**: PayPal client ID
- **Value**: Your PayPal client ID

- **Secret Name**: `PAYPAL_CLIENT_SECRET`
- **Description**: PayPal client secret
- **Value**: Your PayPal client secret

### 5. SMS Provider Keys (Optional)

- **Secret Name**: `TWILIO_ACCOUNT_SID`
- **Description**: Twilio account SID
- **Value**: Your Twilio account SID

- **Secret Name**: `TWILIO_AUTH_TOKEN`
- **Description**: Twilio auth token
- **Value**: Your Twilio auth token

- **Secret Name**: `TWILIO_PHONE_NUMBER`
- **Description**: Twilio phone number
- **Value**: Your Twilio phone number (e.g., `+1234567890`)

### 6. Frontend Environment Variables

- **Secret Name**: `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- **Description**: Stripe publishable key for frontend
- **Value**: Your Stripe publishable key (starts with `pk_`)

- **Secret Name**: `REACT_APP_PAYPAL_CLIENT_ID`
- **Description**: PayPal client ID for frontend
- **Value**: Your PayPal client ID

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** > **Actions**
4. Click **New repository secret**
5. Enter the secret name and value
6. Click **Add secret**

## Workflow Behavior

### Test Workflow (`.github/workflows/test.yml`)

**Triggers**: On any push to any branch or pull request

- ✅ **Backend Tests**: Runs Python tests using pytest
- ✅ **Frontend Tests**: Runs React tests with coverage
- ✅ **Frontend Linting**: Runs ESLint to check code quality
- ✅ **Independent**: Tests run independently and do not block deployments

### Frontend Deployment (`.github/workflows/deploy-frontend.yml`)

**Triggers**:

- On push to `main` branch when frontend files change (`frontend/**`)
- Manual trigger via workflow_dispatch

- ✅ **Build**: Builds React application
- ✅ **Deploy**: Deploys to Firebase Hosting
- ✅ **Independent**: Deploys independently when only frontend code changes

### Backend Deployment (`.github/workflows/deploy-backend.yml`)

**Triggers**:

- On push to `main` branch when backend files change (`backend/**`)
- Manual trigger via workflow_dispatch

- ✅ **Build**: Builds Docker image
- ✅ **Deploy**: Deploys to Cloud Run (integrated with Firebase Hosting)
- ✅ **Independent**: Deploys independently when only backend code changes

## Test Structure

### Backend Tests

- Location: `backend/tests/`
- Framework: pytest
- Coverage: Basic endpoint and functionality tests

### Frontend Tests

- Location: `frontend/src/`
- Framework: Jest + React Testing Library
- Coverage: Component rendering and basic functionality

### Integration Tests

- Location: `backend/tests/integration/`
- Framework: pytest
- Coverage: End-to-end API testing

## Monitoring

After setting up secrets, you can monitor the workflow:

1. Go to your GitHub repository
2. Click on **Actions** tab
3. View workflow runs and their status
4. Click on individual runs to see detailed logs

## Troubleshooting

### Common Issues

1. **Authentication Failed**

   - Check that `FIREBASE_SA_KEY` is correctly formatted JSON (if using)
   - Verify service account has required permissions

2. **Database Connection Failed**

   - Check that `DB_PASSWORD` matches the database user password
   - Verify Cloud SQL instance is running

3. **Build Failed**

   - Check that all dependencies are properly specified
   - Verify Node.js and Python versions match

4. **Deployment Failed**
   - Check that all required secrets are set
   - Verify Google Cloud project ID and region are correct

### Getting Help

- Check the **Actions** tab for detailed error logs
- Review the workflow files:
  - `.github/workflows/test.yml` - Test workflow
  - `.github/workflows/deploy-frontend.yml` - Frontend deployment
  - `.github/workflows/deploy-backend.yml` - Backend deployment
- Ensure all secrets are properly configured

## Workflow Details

### Separate Workflows

1. **Test Workflow** (`.github/workflows/test.yml`):

   - Runs on every push to any branch
   - Runs backend and frontend tests independently
   - Does not trigger deployments

2. **Frontend Deployment** (`.github/workflows/deploy-frontend.yml`):

   - Only triggers when `frontend/**` files change on `main` branch
   - Builds and deploys React app to Firebase Hosting
   - Can be manually triggered if needed

3. **Backend Deployment** (`.github/workflows/deploy-backend.yml`):
   - Only triggers when `backend/**` files change on `main` branch
   - Builds Docker image and deploys to Cloud Run
   - Integrates with Firebase Hosting for API access

### Path-based Triggers

- **Frontend deploys** when files in `frontend/` change
- **Backend deploys** when files in `backend/` change
- Both can deploy independently without affecting each other
- Tests always run regardless of what changed

### Firebase Hosting Integration

The backend is accessible via Firebase Hosting at `/api/**` routes, which are automatically rewritten to the Cloud Run service. The frontend uses `/api` as the API base URL, routing all requests through Firebase Hosting.
