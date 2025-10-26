#!/bin/bash

# Trade Me - Google Cloud Platform Cleanup Script
# This script removes all GCP resources created for the application

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

echo -e "${RED}🗑️  Trade Me - Google Cloud Platform Cleanup${NC}"
echo "=============================================="
echo -e "${YELLOW}⚠️  This will delete ALL resources created for the Trade Me application!${NC}"
echo ""

# Get project ID if not set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Enter your Google Cloud Project ID:${NC}"
    read -p "Project ID: " PROJECT_ID
fi

# Confirmation
echo -e "${RED}Are you sure you want to delete all resources? This action cannot be undone!${NC}"
read -p "Type 'yes' to confirm: " confirmation

if [ "$confirmation" != "yes" ]; then
    echo -e "${GREEN}✅ Cleanup cancelled${NC}"
    exit 0
fi

# Set the project
gcloud config set project $PROJECT_ID

# Delete Cloud Run service
echo -e "${BLUE}🗑️  Deleting Cloud Run service...${NC}"
gcloud run services delete trade-me-backend --region $REGION --quiet || true

# Delete Cloud SQL instance
echo -e "${BLUE}🗑️  Deleting Cloud SQL instance...${NC}"
gcloud sql instances delete $INSTANCE_NAME --quiet || true

# Delete Cloud Storage bucket
echo -e "${BLUE}🗑️  Deleting Cloud Storage bucket...${NC}"
gsutil -m rm -r gs://$PROJECT_ID-trade-me-frontend || true

# Delete Container Registry images
echo -e "${BLUE}🗑️  Deleting Container Registry images...${NC}"
gcloud container images delete gcr.io/$PROJECT_ID/trade-me-backend --force-delete-tags --quiet || true

# Delete Cloud Build triggers (if any)
echo -e "${BLUE}🗑️  Deleting Cloud Build triggers...${NC}"
gcloud builds triggers list --filter="name:trade-me" --format="value(name)" | xargs -I {} gcloud builds triggers delete {} --quiet || true

# Clean up local files
echo -e "${BLUE}🗑️  Cleaning up local files...${NC}"
rm -f .env.gcp
rm -f frontend/.env

echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo -e "${YELLOW}Note: Some resources may take a few minutes to be fully deleted${NC}"
