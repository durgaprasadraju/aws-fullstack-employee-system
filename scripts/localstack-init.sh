#!/bin/bash
# Initialize LocalStack S3 bucket and Secrets Manager for local development
set -euo pipefail

awslocal s3 mb s3://ems-profile-pictures-local 2>/dev/null || true
awslocal s3api put-bucket-acl --bucket ems-profile-pictures-local --acl private

awslocal secretsmanager create-secret \
  --name ems/rds/credentials \
  --secret-string '{"username":"ems_user","password":"ems_password","host":"mysql","readerHost":"mysql","port":3306,"dbname":"employee_management"}' \
  2>/dev/null || true

echo "LocalStack initialization complete"
