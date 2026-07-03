#!/usr/bin/env bash
# Verify CodeDeploy exists before CI tries to create a deployment.
set -euo pipefail

APP="${CODEDEPLOY_APP_NAME:?CODEDEPLOY_APP_NAME is required}"
DG="${CODEDEPLOY_DG_NAME:?CODEDEPLOY_DG_NAME is required}"
REGION="${AWS_REGION:?AWS_REGION is required}"

missing=0

if ! aws deploy get-application --application-name "$APP" --region "$REGION" >/dev/null 2>&1; then
  echo "::error::CodeDeploy application '$APP' not found in region $REGION."
  missing=1
fi

if ! aws deploy get-deployment-group \
  --application-name "$APP" \
  --deployment-group-name "$DG" \
  --region "$REGION" >/dev/null 2>&1; then
  echo "::error::CodeDeploy deployment group '$DG' not found for application '$APP'."
  missing=1
fi

if [ "$missing" -eq 1 ]; then
  cat <<EOF

Infrastructure is not provisioned yet. GitHub Actions cannot deploy the backend
until Terraform creates CodeDeploy resources.

Fix — run locally (once):

  cd terraform
  terraform init
  terraform apply

Then confirm in AWS (${REGION}):

  aws deploy get-application --application-name ${APP} --region ${REGION}
  aws deploy get-deployment-group --application-name ${APP} --deployment-group-name ${DG} --region ${REGION}

Expected names (defaults):
  Application:      ${APP}
  Deployment group: ${DG}

EOF
  exit "${VERIFY_CODEDEPLOY_STRICT:-1}"
fi

echo "CodeDeploy ready: app=${APP}, deployment-group=${DG}, region=${REGION}"
