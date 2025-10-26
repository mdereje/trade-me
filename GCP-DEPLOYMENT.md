# Trade Me Platform - Google Cloud Platform Deployment Guide

## Overview

This guide covers deploying your Trade Me application to Google Cloud Platform using:

- **Backend**: Google Cloud Run with Cloud SQL PostgreSQL
- **Frontend**: Google Cloud Storage with Cloud CDN
- **Database**: Cloud SQL PostgreSQL
- **CI/CD**: Cloud Build for automated deployments

## Prerequisites

1. **Google Cloud Account**: Sign up at [Google Cloud Console](https://console.cloud.google.com)
2. **Google Cloud CLI**: Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. **Node.js 18+**: For frontend builds
4. **Python 3.12+**: For backend development
5. **Docker**: For containerized deployments

## Quick Start

### 1. Initial Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd trade-me

# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Set your project ID
export PROJECT_ID="trade-me-476221"
gcloud config set project $PROJECT_ID
```

### 2. One-Command Deployment

```bash
# Run the automated deployment script
./deploy-gcp.sh
```

This script will:

- Enable required GCP APIs
- Create Cloud SQL PostgreSQL instance
- Deploy backend to Cloud Run
- Deploy frontend to Cloud Storage
- Run database migrations
- Configure environment variables

## Manual Deployment Steps

### Backend Deployment (Cloud Run)

1. **Enable APIs**:

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

2. **Create Cloud SQL Instance**:

```bash
gcloud sql instances create trade-me-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup \
    --enable-ip-alias
```

3. **Create Database and User**:

```bash
gcloud sql databases create trademe --instance=trade-me-db
gcloud sql users create trademe_user --instance=trade-me-db --password=your-secure-password
```

4. **Deploy to Cloud Run**:

```bash
cd backend
gcloud run deploy trade-me-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=postgresql://trademe_user:password@/trademe?host=/cloudsql/PROJECT_ID:us-central1:trade-me-db" \
    --set-env-vars "SECRET_KEY=your-secret-key" \
    --add-cloudsql-instances "PROJECT_ID:us-central1:trade-me-db"
```

### Frontend Deployment (Cloud Storage)

1. **Create Storage Bucket**:

```bash
gsutil mb gs://$PROJECT_ID-trade-me-frontend
gsutil web set -m index.html -e index.html gs://$PROJECT_ID-trade-me-frontend
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-trade-me-frontend
```

2. **Build and Deploy Frontend**:

```bash
cd frontend

# Create environment file
cat > .env << EOF
REACT_APP_API_URL=https://your-backend-url.run.app
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
EOF

# Build and deploy
npm ci
npm run build
gsutil -m cp -r build/* gs://$PROJECT_ID-trade-me-frontend
```

## Database Management

### Running Migrations

```bash
# Create a temporary Cloud Run job for migrations
gcloud run jobs create trade-me-migrate \
    --image gcr.io/$PROJECT_ID/trade-me-backend:latest \
    --region us-central1 \
    --set-env-vars "DATABASE_URL=postgresql://..." \
    --add-cloudsql-instances "PROJECT_ID:us-central1:trade-me-db" \
    --command "alembic" \
    --args "upgrade,head"

# Execute the migration
gcloud run jobs execute trade-me-migrate --region us-central1 --wait

# Clean up migration job
gcloud run jobs delete trade-me-migrate --region us-central1 --quiet
```

### Database Backup

```bash
# Create backup
gcloud sql backups create --instance=trade-me-db

# List backups
gcloud sql backups list --instance=trade-me-db

# Restore from backup
gcloud sql backups restore BACKUP_ID --instance=trade-me-db
```

## CI/CD with Cloud Build

### Automatic Deployments

1. **Connect Repository**:

   - Go to Cloud Build > Triggers
   - Connect your GitHub repository
   - Create trigger for main branch

2. **Build Configuration**:
   - Use the provided `cloudbuild.yaml` files
   - Configure environment variables in Cloud Build

### Manual Builds

```bash
# Build and deploy everything
gcloud builds submit --config cloudbuild.yaml

# Build only backend
gcloud builds submit --config backend/cloudbuild.yaml backend/

# Build only frontend
gcloud builds submit --config frontend/cloudbuild.yaml frontend/
```

## Monitoring and Logging

### View Logs

```bash
# Backend logs
gcloud run services logs read trade-me-backend --region us-central1

# Build logs
gcloud builds log BUILD_ID

# Database logs
gcloud sql operations list --instance=trade-me-db
```

### Monitoring Setup

1. **Cloud Monitoring**: Automatically enabled
2. **Error Reporting**: Automatically enabled
3. **Performance Monitoring**: Configure in Cloud Console

## Management Commands

### Update Application

```bash
# Use the update script
./update-gcp.sh

# Or manually update
gcloud run deploy trade-me-backend --source backend/ --region us-central1
```

### Scale Services

```bash
# Scale Cloud Run service
gcloud run services update trade-me-backend \
    --region us-central1 \
    --min-instances 2 \
    --max-instances 10
```

### Environment Variables

```bash
# Update environment variables
gcloud run services update trade-me-backend \
    --region us-central1 \
    --set-env-vars "NEW_VAR=value"
```

## Cleanup

### Remove All Resources

```bash
# Use the cleanup script
./cleanup-gcp.sh

# Or manually remove resources
gcloud run services delete trade-me-backend --region us-central1
gcloud sql instances delete trade-me-db
gsutil -m rm -r gs://$PROJECT_ID-trade-me-frontend
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:

   ```bash
   # Check Cloud SQL instance status
   gcloud sql instances describe trade-me-db

   # Test connection
   gcloud sql connect trade-me-db --user=trademe_user
   ```

2. **Build Failures**:

   ```bash
   # Check build logs
   gcloud builds log BUILD_ID

   # Test locally
   docker build -t test-image backend/
   ```

3. **Frontend Not Loading**:

   ```bash
   # Check bucket permissions
   gsutil iam get gs://$PROJECT_ID-trade-me-frontend

   # Verify files are uploaded
   gsutil ls gs://$PROJECT_ID-trade-me-frontend
   ```

### Debug Commands

```bash
# Check service status
gcloud run services describe trade-me-backend --region us-central1

# View recent logs
gcloud run services logs read trade-me-backend --region us-central1 --limit 50

# Check database status
gcloud sql instances describe trade-me-db
```

## Performance Optimization

### 1. Cloud Run Optimization

- Set appropriate CPU and memory limits
- Use connection pooling
- Enable HTTP/2

### 2. Database Optimization

- Use read replicas for read-heavy workloads
- Enable query insights
- Regular maintenance windows

### 3. Frontend Optimization

- Enable Cloud CDN
- Use appropriate caching headers
- Optimize images and assets

## Production Checklist

- [ ] Set up custom domain
- [ ] Configure SSL certificates
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Configure security policies
- [ ] Set up logging and monitoring
- [ ] Test disaster recovery
- [ ] Configure cost monitoring
- [ ] Set up performance monitoring

## Useful Links

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
