# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automated testing and deployment of the Trade Me application.

## Required GitHub Secrets

To enable automated deployment, you need to configure the following secrets in your GitHub repository:

### 1. Google Cloud Service Account Key
- **Secret Name**: `GCP_SA_KEY`
- **Description**: JSON key for Google Cloud Service Account with deployment permissions
- **How to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Navigate to IAM & Admin > Service Accounts
  3. Create a new service account or use existing one
  4. Grant the following roles:
     - Cloud Run Admin
     - Storage Admin
     - Cloud SQL Admin
     - Service Account User
  5. Create and download a JSON key
  6. Copy the entire JSON content and paste it as the secret value

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

### On Branch Push/PR (develop, main)
- ✅ **Backend Tests**: Runs Python tests using pytest
- ✅ **Frontend Tests**: Runs React tests with coverage
- ✅ **Frontend Linting**: Runs ESLint to check code quality
- ✅ **Integration Tests**: Runs integration tests (if available)

### On Main Branch Merge
- ✅ **All Tests**: Runs all test suites
- ✅ **Backend Deployment**: Deploys to Google Cloud Run
- ✅ **Frontend Deployment**: Builds and deploys to Cloud Storage
- ✅ **Notification**: Reports deployment status

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
   - Check that `GCP_SA_KEY` is correctly formatted JSON
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
- Review the workflow file: `.github/workflows/deploy.yml`
- Ensure all secrets are properly configured
