#!/usr/bin/env bash
# Create the CI/CD deployment artifacts bucket if it does not exist yet.
set -euo pipefail

BUCKET="${DEPLOY_BUCKET:?DEPLOY_BUCKET is required}"
REGION="${AWS_REGION:?AWS_REGION is required}"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "Deploy bucket already exists: $BUCKET"
  exit 0
fi

echo "Creating deploy bucket: $BUCKET (region: $REGION)"
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  $( [ "$REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$REGION" )

aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-encryption \
  --bucket "$BUCKET" \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

echo "Deploy bucket ready: $BUCKET"
