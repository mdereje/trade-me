#!/bin/bash

# Firebase Deployment Script for Trade Me
# This script deploys both frontend and backend to Firebase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Firebase Deployment${NC}"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed.${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase. Please run: firebase login${NC}"
    exit 1
fi

# Get project ID from .firebaserc
PROJECT_ID=$(node -pe "JSON.parse(require('fs').readFileSync('.firebaserc', 'utf8')).projects.default" 2>/dev/null || echo "")

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-firebase-project-id" ]; then
    echo -e "${RED}❌ Please set your Firebase project ID in .firebaserc${NC}"
    exit 1
fi

echo -e "${GREEN}📦 Building Frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

echo -e "${GREEN}🐳 Building Backend Docker Image...${NC}"
cd backend
# Get the latest commit SHA for tagging
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# Build and push Docker image to Artifact Registry
echo "Building Docker image..."
docker build -t gcr.io/${PROJECT_ID}/backend:${COMMIT_SHA} .
docker tag gcr.io/${PROJECT_ID}/backend:${COMMIT_SHA} gcr.io/${PROJECT_ID}/backend:latest

echo "Pushing Docker image to Artifact Registry..."
docker push gcr.io/${PROJECT_ID}/backend:${COMMIT_SHA}
docker push gcr.io/${PROJECT_ID}/backend:latest

cd ..

echo -e "${GREEN}☁️  Deploying Backend to Cloud Run...${NC}"
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
  --project ${PROJECT_ID} || {
    echo -e "${YELLOW}⚠️  Cloud Run deployment failed or service doesn't exist.${NC}"
    echo "You may need to create the service first or set up secrets."
}

echo -e "${GREEN}🌐 Deploying Frontend to Firebase Hosting...${NC}"
firebase deploy --only hosting

# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe backend --platform managed --region us-central1 --format="value(status.url)" --project ${PROJECT_ID} 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo -e "${GREEN}Backend URL: ${SERVICE_URL}${NC}"
    echo -e "${GREEN}Frontend URL: https://${PROJECT_ID}.web.app${NC}"
else
    echo -e "${YELLOW}⚠️  Deployment completed, but couldn't retrieve backend URL.${NC}"
    echo "Check Cloud Run console for the service URL."
fi

