#!/bin/bash

# Trade Me - Google Cloud Platform Update Script
# This script updates the deployed application

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

echo -e "${BLUE}🔄 Trade Me - Google Cloud Platform Update${NC}"
echo "=============================================="

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
gcloud config set project $PROJECT_ID

# Update backend
echo -e "${BLUE}🚀 Updating backend...${NC}"
cd backend
gcloud run deploy trade-me-backend \
    --source . \
    --platform managed \
    --region $REGION

# Get backend URL
BACKEND_URL=$(gcloud run services describe trade-me-backend --platform managed --region $REGION --format 'value(status.url)')
echo -e "${GREEN}✅ Backend updated at: $BACKEND_URL${NC}"

# Update frontend
echo -e "${BLUE}🎨 Updating frontend...${NC}"
cd ../frontend

# Create .env file for build
cat > .env << EOF
REACT_APP_API_URL=$BACKEND_URL
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
PUBLIC_URL=https://storage.googleapis.com/trade-me-476221-trade-me-frontend
EOF

# Build the frontend
npm run build

# Deploy to Cloud Storage
gsutil -m cp -r build/* gs://$PROJECT_ID-trade-me-frontend

# Create app-v2.html to bypass caching issues
gsutil cp build/index.html gs://$PROJECT_ID-trade-me-frontend/app-v2.html

# Get frontend URL
FRONTEND_URL="https://storage.googleapis.com/$PROJECT_ID-trade-me-frontend/app-v2.html"
echo -e "${GREEN}✅ Frontend updated at: $FRONTEND_URL${NC}"

echo -e "${GREEN}🎉 Update completed successfully!${NC}"
