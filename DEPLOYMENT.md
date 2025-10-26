# Trade Me Platform - Deployment Guide

## Quick Start

Deploy your Trade Me application to Google Cloud Platform with a single command:

```bash
./deploy-gcp.sh
```

## Documentation Structure

- **[GCP-DEPLOYMENT.md](./GCP-DEPLOYMENT.md)** - Complete deployment guide with step-by-step instructions
- **[GCP-ENVIRONMENT-SETUP.md](./GCP-ENVIRONMENT-SETUP.md)** - Environment variables and secrets configuration

## Architecture

**Production Stack:**

- **Backend**: Google Cloud Run with Cloud SQL PostgreSQL
- **Frontend**: Google Cloud Storage with Cloud CDN
- **Database**: Cloud SQL PostgreSQL
- **CI/CD**: Cloud Build with GitHub integration

**Development Stack:**

- **Backend**: Local with SQLite
- **Frontend**: Local with npm start
- **Database**: SQLite (included)

## Cost Estimation

- **Cloud Run**: $0-20/month (pay-per-request)
- **Cloud SQL**: $25-50/month (db-f1-micro)
- **Cloud Storage**: $1-5/month (based on usage)
- **Total**: ~$30-85/month

## Management Commands

```bash
# Deploy everything
./deploy-gcp.sh

# Update existing deployment
./update-gcp.sh

# Remove all resources
./cleanup-gcp.sh
```

## Quick Links

- [Complete Deployment Guide](./GCP-DEPLOYMENT.md)
- [Environment Setup](./GCP-ENVIRONMENT-SETUP.md)
- [Google Cloud Console](https://console.cloud.google.com)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
