# Firebase Quick Start Guide

Quick reference for deploying Trade Me to Firebase.

## 🚀 Quick Deploy

1. **Set up Firebase project:**
   ```bash
   # .firebaserc is already configured with project ID: trade-me-13f73
   firebase login
   ```

2. **Set up Cloud SQL PostgreSQL:**
   ```bash
   gcloud sql instances create trade-me-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-central1 \
     --root-password=YOUR_PASSWORD
   
   gcloud sql databases create trademe --instance=trade-me-db
   ```

3. **Create secrets:**
   ```bash
   PROJECT_ID="trade-me-13f73"
   echo -n "postgresql://user:pass@/trademe?host=/cloudsql/${PROJECT_ID}:us-central1:trade-me-db" | \
     gcloud secrets create database-url --data-file=-
   
   echo -n "your-secret-key" | gcloud secrets create secret-key --data-file=-
   ```

4. **Deploy:**
   ```bash
   ./deploy-firebase.sh
   ```

## 📋 Prerequisites Checklist

- [ ] Firebase project created
- [ ] Google Cloud billing enabled
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Google Cloud SDK installed (`gcloud`)
- [ ] Docker installed
- [ ] `.firebaserc` configured (already set to trade-me-13f73)

## 🔧 Configuration Files

- **`firebase.json`** - Firebase Hosting configuration
- **`.firebaserc`** - Firebase project mapping
- **`backend/app/database.py`** - Database connection (updated for Firebase)
- **`backend/main.py`** - CORS configuration (updated for Firebase)
- **`frontend/src/App.tsx`** - Router changed to BrowserRouter for Firebase Hosting

## 📚 Full Documentation

See [FIREBASE-SETUP.md](./FIREBASE-SETUP.md) for detailed setup instructions.

## 🌐 URLs

After deployment:
- **Frontend**: `https://trade-me-13f73.web.app`
- **Backend**: `https://backend-XXXXX-uc.a.run.app` (from Cloud Run console)

## 🔍 Verify Deployment

```bash
# Check backend health
curl https://backend-XXXXX-uc.a.run.app/health

# Check frontend
curl https://trade-me-13f73.web.app
```

