# Trade Me - Environment Variables & Secrets Setup

## Environment Variables Configuration

This guide covers setting up environment variables and secrets for your Trade Me application on Google Cloud Platform.

## Required Environment Variables

### Backend (Cloud Run)

#### Database Configuration

```bash
DATABASE_URL=postgresql://trademe_user:password@/trademe?host=/cloudsql/PROJECT_ID:us-central1:trade-me-db
```

#### Application Security

```bash
SECRET_KEY=your-super-secret-key-here
CORS_ORIGINS=https://storage.googleapis.com/PROJECT_ID-trade-me-frontend/index.html
```

#### Payment Providers

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
```

#### SMS/Phone Verification

```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Frontend (Build-time)

```bash
REACT_APP_API_URL=https://trade-me-backend-PROJECT_ID.uc.r.appspot.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
```

## Setting Up Environment Variables

### Method 1: Using gcloud CLI

```bash
# Set environment variables for Cloud Run
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-env-vars "SECRET_KEY=your-secret-key" \
    --set-env-vars "STRIPE_SECRET_KEY=sk_test_..." \
    --set-env-vars "PAYPAL_CLIENT_ID=your-paypal-id" \
    --set-env-vars "PAYPAL_CLIENT_SECRET=your-paypal-secret" \
    --set-env-vars "TWILIO_ACCOUNT_SID=your-twilio-sid" \
    --set-env-vars "TWILIO_AUTH_TOKEN=your-twilio-token" \
    --set-env-vars "TWILIO_PHONE_NUMBER=+1234567890"
```

### Method 2: Using Google Cloud Console

1. Go to Cloud Run in the Google Cloud Console
2. Select your `trade-me-backend` service
3. Click "Edit & Deploy New Revision"
4. Go to the "Variables & Secrets" tab
5. Add each environment variable
6. Click "Deploy"

### Method 3: Using Secret Manager (Recommended for Production)

#### 1. Create Secrets in Secret Manager

```bash
# Create secrets
echo -n "your-secret-key" | gcloud secrets create secret-key --data-file=-
echo -n "sk_test_your_stripe_key" | gcloud secrets create stripe-secret-key --data-file=-
echo -n "your_paypal_client_id" | gcloud secrets create paypal-client-id --data-file=-
echo -n "your_paypal_secret" | gcloud secrets create paypal-client-secret --data-file=-
echo -n "your_twilio_sid" | gcloud secrets create twilio-account-sid --data-file=-
echo -n "your_twilio_token" | gcloud secrets create twilio-auth-token --data-file=-
echo -n "+1234567890" | gcloud secrets create twilio-phone-number --data-file=-
```

#### 2. Grant Cloud Run Access to Secrets

```bash
# Get the service account
SERVICE_ACCOUNT=$(gcloud run services describe trade-me-backend \
    --region us-central1 \
    --format 'value(spec.template.spec.serviceAccountName)')

# Grant access to secrets
gcloud secrets add-iam-policy-binding secret-key \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding stripe-secret-key \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

# ... repeat for other secrets
```

#### 3. Use Secrets in Cloud Run

```bash
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-secrets "SECRET_KEY=secret-key:latest" \
    --set-secrets "STRIPE_SECRET_KEY=stripe-secret-key:latest" \
    --set-secrets "PAYPAL_CLIENT_ID=paypal-client-id:latest" \
    --set-secrets "PAYPAL_CLIENT_SECRET=paypal-client-secret:latest" \
    --set-secrets "TWILIO_ACCOUNT_SID=twilio-account-sid:latest" \
    --set-secrets "TWILIO_AUTH_TOKEN=twilio-auth-token:latest" \
    --set-secrets "TWILIO_PHONE_NUMBER=twilio-phone-number:latest"
```

## Payment Provider Setup

### Stripe Setup

1. **Create Stripe Account**: Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Get API Keys**:
   - Secret Key: `sk_test_...` (for backend)
   - Publishable Key: `pk_test_...` (for frontend)
3. **Set Environment Variables**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### PayPal Setup

1. **Create PayPal Developer Account**: Go to [PayPal Developer](https://developer.paypal.com)
2. **Create App**:
   - Sandbox for testing
   - Live for production
3. **Get Credentials**:
   - Client ID
   - Client Secret
4. **Set Environment Variables**:
   ```bash
   PAYPAL_CLIENT_ID=your_client_id
   PAYPAL_CLIENT_SECRET=your_client_secret
   REACT_APP_PAYPAL_CLIENT_ID=your_client_id
   ```

## SMS Provider Setup (Twilio)

### Twilio Setup

1. **Create Twilio Account**: Go to [Twilio Console](https://console.twilio.com)
2. **Get Credentials**:
   - Account SID
   - Auth Token
   - Phone Number
3. **Set Environment Variables**:
   ```bash
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

## Security Best Practices

### 1. Use Strong Secrets

```bash
# Generate strong secret key
openssl rand -base64 32

# Generate database password
openssl rand -base64 32
```

### 2. Rotate Secrets Regularly

```bash
# Update secret in Secret Manager
echo -n "new-secret-value" | gcloud secrets versions add secret-key --data-file=-

# Update Cloud Run to use latest version
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-secrets "SECRET_KEY=secret-key:latest"
```

### 3. Limit Access

```bash
# Grant minimal permissions
gcloud secrets add-iam-policy-binding secret-key \
    --member="serviceAccount:service-account@project.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Testing Environment Variables

### Test Backend Variables

```bash
# Check if variables are set
gcloud run services describe trade-me-backend \
    --region us-central1 \
    --format 'value(spec.template.spec.containers[0].env[].name)'

# Test database connection
gcloud run services logs read trade-me-backend \
    --region us-central1 \
    --limit 10
```

### Test Frontend Variables

```bash
# Check build environment
cd frontend
cat .env

# Test build with variables
npm run build
```

## Environment Management

### Development Environment

```bash
# Create .env file for local development
cat > backend/.env << EOF
DATABASE_URL=sqlite:///./trademe.db
SECRET_KEY=dev-secret-key
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
EOF
```

### Production Environment

```bash
# Use Secret Manager for production
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-secrets "SECRET_KEY=secret-key:latest"
```

## Monitoring Environment Variables

### View Current Variables

```bash
# List all environment variables
gcloud run services describe trade-me-backend \
    --region us-central1 \
    --format 'value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)'
```

### Monitor Secret Usage

```bash
# Check secret access logs
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret" \
    --limit 50 \
    --format json
```

## Troubleshooting

### Common Issues

1. **Secret Not Found**:

   ```bash
   # Check if secret exists
   gcloud secrets list

   # Check secret permissions
   gcloud secrets get-iam-policy secret-name
   ```

2. **Environment Variable Not Set**:

   ```bash
   # Check service configuration
   gcloud run services describe trade-me-backend --region us-central1
   ```

3. **Database Connection Issues**:
   ```bash
   # Test database connection
   gcloud sql connect trade-me-db --user=trademe_user
   ```

### Debug Commands

```bash
# View service logs
gcloud run services logs read trade-me-backend --region us-central1

# Check service status
gcloud run services describe trade-me-backend --region us-central1

# Test environment variables
gcloud run services logs read trade-me-backend --region us-central1 --limit 10
```

## Environment Checklist

- [ ] Database URL configured
- [ ] Secret key set (strong and unique)
- [ ] Payment providers configured
- [ ] SMS provider configured
- [ ] CORS origins set correctly
- [ ] Secrets stored in Secret Manager (production)
- [ ] Service account has proper permissions
- [ ] Environment variables tested
- [ ] Backup secrets stored securely
- [ ] Rotation schedule established

## Useful Commands

```bash
# Update all environment variables at once
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-env-vars "VAR1=value1,VAR2=value2"

# Remove environment variable
gcloud run services update trade-me-backend \
    --region us-central1 \
    --remove-env-vars "VAR_NAME"

# Update secret reference
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-secrets "SECRET_VAR=secret-name:latest"
```
