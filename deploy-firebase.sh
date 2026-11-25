#!/bin/bash

# Firebase + Cloud Run Deployment Script for Trade Me
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

REGION="${REGION:-us-central1}"
AR_REPO="${AR_REPO:-trade-me}"
CLOUDSQL_INSTANCE_NAME="${CLOUDSQL_INSTANCE_NAME:-trade-me-db}"

echo -e "${GREEN}Starting Trade Me Deployment${NC}"

for bin in firebase gcloud docker npm; do
  if ! command -v "$bin" &> /dev/null; then
    echo -e "${RED}Missing required CLI: $bin${NC}"
    exit 1
  fi
done

PROJECT_ID=$(node -pe "JSON.parse(require('fs').readFileSync('.firebaserc', 'utf8')).projects.default" 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-firebase-project-id" ]; then
  echo -e "${RED}Please set your Firebase project ID in .firebaserc${NC}"
  exit 1
fi

COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/backend"
CLOUDSQL_INSTANCE="${PROJECT_ID}:${REGION}:${CLOUDSQL_INSTANCE_NAME}"

echo -e "${GREEN}Building Frontend (same-origin /api rewrites)...${NC}"
npm ci
REACT_APP_API_URL="" npm --workspace=frontend run build

echo -e "${GREEN}Building & Pushing Backend Docker Image...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker build -t "${IMAGE}:${COMMIT_SHA}" -t "${IMAGE}:latest" ./backend
docker push "${IMAGE}:${COMMIT_SHA}"
docker push "${IMAGE}:latest"

echo -e "${GREEN}Running Alembic Migrations via Cloud Run Job...${NC}"
gcloud run jobs deploy migrate-db \
  --image "${IMAGE}:${COMMIT_SHA}" \
  --region "${REGION}" \
  --set-secrets "DATABASE_URL=database-url:latest" \
  --set-cloudsql-instances "${CLOUDSQL_INSTANCE}" \
  --command alembic \
  --args upgrade,head \
  --project "${PROJECT_ID}"
gcloud run jobs execute migrate-db --region "${REGION}" --project "${PROJECT_ID}" --wait

echo -e "${GREEN}Deploying Backend to Cloud Run...${NC}"
gcloud run deploy backend \
  --image "${IMAGE}:${COMMIT_SHA}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "ENV=production,ALGORITHM=HS256,ACCESS_TOKEN_EXPIRE_MINUTES=60,FIREBASE_PROJECT_ID=${PROJECT_ID},FRONTEND_URL=https://${PROJECT_ID}.web.app,GCS_BUCKET_NAME=${PROJECT_ID}-uploads,STRIPE_PRICE_MONTHLY_ID=${STRIPE_PRICE_MONTHLY_ID:-},STRIPE_PRICE_ANNUAL_ID=${STRIPE_PRICE_ANNUAL_ID:-}" \
  --set-secrets "DATABASE_URL=database-url:latest,SECRET_KEY=secret-key:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest" \
  --add-cloudsql-instances "${CLOUDSQL_INSTANCE}" \
  --project "${PROJECT_ID}"

echo -e "${GREEN}Deploying Frontend to Firebase Hosting...${NC}"
firebase deploy --only hosting --project "${PROJECT_ID}"

echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}Live URL: https://${PROJECT_ID}.web.app${NC}"
echo -e "${GREEN}Health Check: https://${PROJECT_ID}.web.app/api/health${NC}"
