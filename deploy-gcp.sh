#!/bin/bash

# Trade Me - Google Cloud Platform Deployment Script
# This script sets up and deploys the entire application to GCP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
INSTANCE_NAME="trade-me-db"
DB_NAME="trademe"
DB_USER="trademe_user"

echo -e "${BLUE}🚀 Trade Me - Google Cloud Platform Deployment${NC}"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Google Cloud CLI is not installed. Please install it first:${NC}"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with Google Cloud. Please run:${NC}"
    echo "gcloud auth login"
    exit 1
fi

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}Enter your Google Cloud Project ID:${NC}"
        read -p "Project ID: " PROJECT_ID
    else
        echo -e "${BLUE}Using current project: $PROJECT_ID${NC}"
    fi
fi

# Set the project
echo -e "${BLUE}📋 Setting project to: $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable servicenetworking.googleapis.com

# Set up service networking
echo -e "${BLUE}🌐 Setting up service networking...${NC}"
# Allocate IP range for Google services (if it doesn't exist)
gcloud compute addresses create google-managed-services-default \
    --global \
    --purpose=VPC_PEERING \
    --prefix-length=16 \
    --network=default || echo "IP range already exists, continuing..."

# Connect the service networking
gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=google-managed-services-default \
    --network=default || echo "VPC peering already exists, continuing..."

# Create Cloud SQL instance
echo -e "${BLUE}🗄️  Creating Cloud SQL PostgreSQL instance...${NC}"
gcloud sql instances create $INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup \
    --network=default || echo "Cloud SQL instance already exists, continuing..."

# Create database
echo -e "${BLUE}📊 Creating database...${NC}"
gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME || echo "Database already exists, continuing..."

# Generate random password for database user
DB_PASSWORD=$(openssl rand -base64 32)
echo -e "${BLUE}👤 Creating database user...${NC}"
gcloud sql users create $DB_USER --instance=$INSTANCE_NAME --password=$DB_PASSWORD || echo "Database user already exists, continuing..."

# Create Cloud Storage bucket for frontend
echo -e "${BLUE}📦 Creating Cloud Storage bucket for frontend...${NC}"
gsutil mb gs://$PROJECT_ID-trade-me-frontend || echo "Bucket already exists, continuing..."
gsutil web set -m index.html -e index.html gs://$PROJECT_ID-trade-me-frontend

# Make bucket publicly readable
gsutil iam ch allUsers:objectViewer gs://$PROJECT_ID-trade-me-frontend

# Create environment file for secrets
echo -e "${BLUE}🔐 Creating environment configuration...${NC}"
cat > .env.gcp << EOF
PROJECT_ID=$PROJECT_ID
REGION=$REGION
INSTANCE_NAME=$INSTANCE_NAME
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
SECRET_KEY=$(openssl rand -base64 32)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
EOF

echo -e "${GREEN}✅ Environment configuration created in .env.gcp${NC}"
echo -e "${YELLOW}⚠️  Please update the payment and SMS provider keys in .env.gcp${NC}"

# Deploy backend
echo -e "${BLUE}🚀 Deploying backend to Cloud Run...${NC}"
cd backend
gcloud run deploy trade-me-backend \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME" \
    --set-env-vars "SECRET_KEY=$(openssl rand -base64 32)" \
    --set-env-vars "STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key" \
    --set-env-vars "PAYPAL_CLIENT_ID=your_paypal_client_id" \
    --set-env-vars "PAYPAL_CLIENT_SECRET=your_paypal_secret" \
    --set-env-vars "TWILIO_ACCOUNT_SID=your_twilio_sid" \
    --set-env-vars "TWILIO_AUTH_TOKEN=your_twilio_token" \
    --set-env-vars "TWILIO_PHONE_NUMBER=+1234567890" \
    --set-env-vars "CORS_ORIGINS=https://storage.googleapis.com/$PROJECT_ID-trade-me-frontend/index.html" \
    --add-cloudsql-instances "$PROJECT_ID:$REGION:$INSTANCE_NAME"

# Get backend URL
BACKEND_URL=$(gcloud run services describe trade-me-backend --platform managed --region $REGION --format 'value(status.url)')
echo -e "${GREEN}✅ Backend deployed at: $BACKEND_URL${NC}"

# Build and deploy frontend
echo -e "${BLUE}🎨 Building and deploying frontend...${NC}"
cd ../frontend

# Create .env file for build
cat > .env << EOF
REACT_APP_API_URL=$BACKEND_URL
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
EOF

# Build the frontend
npm ci
npm run build

# Deploy to Cloud Storage
gsutil -m cp -r build/* gs://$PROJECT_ID-trade-me-frontend

# Get frontend URL
FRONTEND_URL="https://storage.googleapis.com/$PROJECT_ID-trade-me-frontend/index.html"
echo -e "${GREEN}✅ Frontend deployed at: $FRONTEND_URL${NC}"

# Database tables are created automatically by the application
echo -e "${GREEN}✅ Database tables will be created automatically by the application${NC}"

# Summary
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}Backend URL:${NC} $BACKEND_URL"
echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
echo -e "${BLUE}Database:${NC} $PROJECT_ID:$REGION:$INSTANCE_NAME"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update payment provider keys in Cloud Run environment variables"
echo "2. Set up custom domain (optional)"
echo "3. Configure monitoring and alerts"
echo "4. Set up SSL certificates for custom domains"
echo ""
echo -e "${BLUE}To update environment variables:${NC}"
echo "gcloud run services update trade-me-backend --region $REGION --set-env-vars KEY=VALUE"
echo ""
echo -e "${BLUE}To view logs:${NC}"
echo "gcloud run services logs read trade-me-backend --region $REGION"
