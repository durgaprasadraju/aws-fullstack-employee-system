#!/usr/bin/env bash
# Build frontend and upload dist.tar.gz to the deploy S3 bucket (one-time or manual deploy).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${DEPLOY_BUCKET:-ems-deploy-artifacts-production}"
REGION="${AWS_REGION:-us-west-2}"

if ! aws sts get-caller-identity --region "$REGION" >/dev/null 2>&1; then
  echo "ERROR: AWS credentials not found."
  echo "Run: aws configure"
  echo "Then verify: aws sts get-caller-identity"
  echo "Do NOT run this script with sudo."
  exit 1
fi

echo "AWS account: $(aws sts get-caller-identity --query Account --output text)"

if [ "${SKIP_BUILD:-}" = "1" ] && [ -f "$ROOT/frontend/dist/index.html" ]; then
  echo "Skipping build (SKIP_BUILD=1, dist/ exists)"
else
  echo "Building frontend..."
  cd "$ROOT/frontend"
  npm ci
  VITE_API_URL=/api/v1 npm run build
fi

cd "$ROOT/frontend"

echo "Uploading to s3://${BUCKET}/frontend/dist.tar.gz ..."
ARCHIVE="$(mktemp /tmp/ems-frontend-dist.XXXXXX.tar.gz)"
tar -czf "$ARCHIVE" -C dist .
aws s3 cp "$ARCHIVE" "s3://${BUCKET}/frontend/dist.tar.gz" --region "$REGION"
rm -f "$ARCHIVE"

if [ "${1:-}" = "--ssm" ]; then
  echo "Deploying to EC2 via SSM..."
  export DEPLOY_BUCKET="$BUCKET" AWS_REGION="$REGION"
  bash "$ROOT/scripts/deploy-frontend-ssm.sh"
else
  echo "Uploaded. Deploy to EC2 with: DEPLOY_BUCKET=${BUCKET} AWS_REGION=${REGION} bash scripts/deploy-frontend-ssm.sh"
fi
