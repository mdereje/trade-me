# Firebase Setup Guide for Trade Me

This guide will help you migrate the Trade Me application to Firebase Hosting (frontend), Firebase Cloud Run (backend), and Firebase Data Connect (PostgreSQL).

## 📋 Prerequisites

1. **Firebase Account**: Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. **Google Cloud Account**: Ensure billing is enabled (required for Cloud Run and Cloud SQL)
3. **Firebase CLI**: Install globally with `npm install -g firebase-tools`
4. **Google Cloud SDK**: Install `gcloud` CLI for Cloud Run deployment
5. **Docker**: Required for building backend container images

## 🔧 Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "trade-me")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Required APIs

Enable the following APIs in [Google Cloud Console](https://console.cloud.google.com/apis/library):

- **Cloud Run API**
- **Cloud SQL Admin API**
- **Cloud Build API**
- **Artifact Registry API**
- **Secret Manager API**

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

### 1.3 Configure Firebase Project ID

The `.firebaserc` is already configured with the project ID `trade-me-13f73`. If you need to change it:

```json
{
  "projects": {
    "default": "trade-me-13f73"
  }
}
```

### 1.4 Login to Firebase

```bash
firebase login
```

## 🗄️ Step 2: Set Up PostgreSQL Database

### 2.1 Create Cloud SQL PostgreSQL Instance

```bash
gcloud sql instances create trade-me-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_ROOT_PASSWORD
```

### 2.2 Create Database

```bash
gcloud sql databases create trademe --instance=trade-me-db
```

### 2.3 Create Database User

```bash
gcloud sql users create trademe_user \
  --instance=trade-me-db \
  --password=YOUR_PASSWORD
```

### 2.4 Set Up Firebase Data Connect

1. Go to Firebase Console → Data Connect
2. Click "Create connector"
3. Select "PostgreSQL"
4. Enter connection details:
   - **Host**: Use the Cloud SQL instance connection name
   - **Port**: 5432
   - **Database**: trademe
   - **User**: trademe_user
   - **Password**: Your password

### 2.5 Get Connection String

The connection string format will be:
```
postgresql://trademe_user:YOUR_PASSWORD@/trademe?host=/cloudsql/trade-me-13f73:us-central1:trade-me-db
```

For direct connection (from local):
```
postgresql://trademe_user:YOUR_PASSWORD@DATABASE_IP:5432/trademe
```

Get the database IP:
```bash
gcloud sql instances describe trade-me-db --format="value(ipAddresses[0].ipAddress)"
```

## 🔐 Step 3: Set Up Secrets

### 3.1 Create Secrets in Secret Manager

```bash
# Database URL secret
echo -n "postgresql://trademe_user:YOUR_PASSWORD@/trademe?host=/cloudsql/trade-me-13f73:us-central1:trade-me-db" | \
  gcloud secrets create database-url --data-file=-

# JWT Secret Key
echo -n "your-super-secret-jwt-key-here" | \
  gcloud secrets create secret-key --data-file=-

# Other secrets (optional)
echo -n "your-stripe-secret-key" | \
  gcloud secrets create stripe-secret-key --data-file=-

echo -n "your-twilio-account-sid" | \
  gcloud secrets create twilio-account-sid --data-file=-
```

### 3.2 Grant Cloud Run Access to Secrets

```bash
PROJECT_ID="trade-me-13f73"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding secret-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 🚀 Step 4: Deploy Backend to Cloud Run

### 4.1 Build and Push Docker Image

```bash
PROJECT_ID="trade-me-13f73"
cd backend

# Build Docker image
docker build -t gcr.io/${PROJECT_ID}/backend:latest .

# Push to Artifact Registry
docker push gcr.io/${PROJECT_ID}/backend:latest
```

### 4.2 Deploy to Cloud Run

```bash
PROJECT_ID="trade-me-13f73"
gcloud run deploy backend \
  --image gcr.io/${PROJECT_ID}/backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "ALGORITHM=HS256,ACCESS_TOKEN_EXPIRE_MINUTES=30" \
  --set-secrets "DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest" \
  --add-cloudsql-instances ${PROJECT_ID}:us-central1:trade-me-db \
  --project ${PROJECT_ID}
```

### 4.3 Get Backend URL

```bash
BACKEND_URL=$(gcloud run services describe backend \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)" \
  --project ${PROJECT_ID})

echo "Backend URL: $BACKEND_URL"
```

## 🌐 Step 5: Deploy Frontend to Firebase Hosting

### 5.1 Configure Frontend Environment Variables

Create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://backend-XXXXX-uc.a.run.app
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_FACEBOOK_APP_ID=your-facebook-app-id
REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

Replace `https://backend-XXXXX-uc.a.run.app` with your actual Cloud Run service URL.

### 5.2 Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 5.3 Initialize Firebase Hosting

```bash
firebase init hosting
```

Select:
- Use existing project
- Public directory: `frontend/build`
- Configure as single-page app: Yes
- Set up automatic builds: No (we'll do manual)

### 5.4 Update firebase.json

The `firebase.json` is already configured, but you need to update the Cloud Run service URL in the rewrite rule if using hosted rewrites.

### 5.5 Deploy Frontend

```bash
firebase deploy --only hosting
```

## 🔗 Step 6: Connect Firebase Hosting to Cloud Run

### 6.1 Get Cloud Run Service URL

```bash
PROJECT_ID="trade-me-13f73"
SERVICE_URL=$(gcloud run services describe backend \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)" \
  --project ${PROJECT_ID})
```

### 6.2 Update Firebase Hosting Rewrites

The `firebase.json` already includes rewrites to proxy `/api/**` requests to Cloud Run. Ensure the service name matches your deployed service.

### 6.3 Update CORS in Backend

Update `backend/main.py` to include your Firebase Hosting domain in CORS origins:

```python
allow_origins=[
    "http://localhost:3000",
    f"https://{os.getenv('FIREBASE_PROJECT_ID', 'your-project-id')}.web.app",
    f"https://{os.getenv('FIREBASE_PROJECT_ID', 'your-project-id')}.firebaseapp.com",
]
```

### 6.4 Redeploy Backend with Updated CORS

```bash
# Rebuild and redeploy
PROJECT_ID="trade-me-13f73"
cd backend
docker build -t gcr.io/${PROJECT_ID}/backend:latest .
docker push gcr.io/${PROJECT_ID}/backend:latest
gcloud run deploy backend --image gcr.io/${PROJECT_ID}/backend:latest --region us-central1 --project ${PROJECT_ID}
```

## 📊 Step 7: Database Migrations

### 7.1 Run Migrations Locally

First, connect to your Cloud SQL instance locally:

```bash
# Create Cloud SQL proxy
PROJECT_ID="trade-me-13f73"
cloud-sql-proxy ${PROJECT_ID}:us-central1:trade-me-db
```

# In another terminal, set DATABASE_URL
export DATABASE_URL="postgresql://trademe_user:YOUR_PASSWORD@localhost:5432/trademe"

# Run migrations
cd backend
alembic upgrade head
```

### 7.2 Run Migrations from Cloud Run

Alternatively, you can create a migration job in Cloud Run:

```bash
PROJECT_ID="trade-me-13f73"
gcloud run jobs create migrate-db \
  --image gcr.io/${PROJECT_ID}/backend:latest \
  --region us-central1 \
  --set-secrets "DATABASE_URL=database-url:latest" \
  --command python \
  --args -m,alembic,upgrade,head \
  --project ${PROJECT_ID}

# Run the job
gcloud run jobs execute migrate-db --region us-central1
```

## 🔄 Step 8: Automated Deployment

### 8.1 Use the Deployment Script

```bash
chmod +x deploy-firebase.sh
./deploy-firebase.sh
```

### 8.2 Set Up GitHub Actions (Optional)

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.FIREBASE_SA_KEY }}
          project_id: trade-me-13f73
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g firebase-tools
      - run: ./deploy-firebase.sh
        env:
          FIREBASE_PROJECT_ID: trade-me-13f73
```

## 🧪 Step 9: Testing

### 9.1 Test Backend API

```bash
# Test health endpoint
curl https://backend-XXXXX-uc.a.run.app/health

# Test root endpoint
curl https://backend-XXXXX-uc.a.run.app/
```

### 9.2 Test Frontend

Visit your Firebase Hosting URL:
- Production: `https://trade-me-13f73.web.app`
- Preview: `https://trade-me-13f73.firebaseapp.com`

### 9.3 Test API Integration

Ensure frontend can communicate with backend by checking browser console for any CORS errors.

## 📝 Environment Variables Reference

### Backend (Cloud Run Secrets/Env Vars)

- `DATABASE_URL` - PostgreSQL connection string (Secret)
- `SECRET_KEY` - JWT secret key (Secret)
- `ALGORITHM` - JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiry (default: 30)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `STRIPE_SECRET_KEY` - Stripe API key (Secret, optional)
- `TWILIO_ACCOUNT_SID` - Twilio credentials (Secret, optional)

### Frontend (.env.production)

- `REACT_APP_API_URL` - Backend Cloud Run URL
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## 🔍 Troubleshooting

### Backend not accessible

1. Check Cloud Run service status:
   ```bash
   gcloud run services describe backend --region us-central1
   ```

2. Check logs:
   ```bash
   gcloud run services logs read backend --region us-central1
   ```

### Database connection issues

1. Verify Cloud SQL instance is running
2. Check connection string format
3. Ensure Cloud Run has Cloud SQL connection permissions
4. Verify secrets are correctly configured

### Frontend can't reach backend

1. Check CORS configuration in backend
2. Verify API URL in frontend `.env.production`
3. Check Firebase Hosting rewrites in `firebase.json`

### Secrets not accessible

1. Verify IAM permissions on secrets
2. Check service account has `secretmanager.secretAccessor` role
3. Ensure secret versions exist

## 📚 Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Firebase Data Connect Documentation](https://firebase.google.com/docs/data-connect)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase/Cloud Run logs
3. Consult Firebase and Google Cloud documentation
4. Check project GitHub issues

