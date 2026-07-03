#!/usr/bin/env bash
# Deploy frontend dist.tar.gz to EC2 instances via SSM Run Command.
set -euo pipefail

BUCKET="${DEPLOY_BUCKET:?DEPLOY_BUCKET is required}"
REGION="${AWS_REGION:?AWS_REGION is required}"

INSTANCES=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=ems-frontend-*" "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].InstanceId" --output text)

if [ -z "$INSTANCES" ]; then
  echo "::warning::No running frontend instances found — S3 upload complete, skipping SSM deploy."
  exit 0
fi

DEPLOYED=0
for INSTANCE in $INSTANCES; do
  SSM_STATUS=$(aws ssm describe-instance-information \
    --region "$REGION" \
    --filters "Key=InstanceIds,Values=${INSTANCE}" \
    --query "InstanceInformationList[0].PingStatus" \
    --output text 2>/dev/null || echo "None")

  if [ "$SSM_STATUS" != "Online" ]; then
    echo "::warning::Instance ${INSTANCE} is not SSM Online (status: ${SSM_STATUS}). Skipping."
    echo "::warning::Run 'terraform apply' to attach the frontend IAM/SSM role, then retry CI."
    continue
  fi

  echo "Deploying to ${INSTANCE}..."
  COMMAND_ID=$(aws ssm send-command \
    --region "$REGION" \
    --instance-ids "$INSTANCE" \
    --document-name "AWS-RunShellScript" \
    --parameters commands="[
      \"aws s3 cp s3://${BUCKET}/frontend/dist.tar.gz /tmp/dist.tar.gz --region ${REGION}\",
      \"tar -xzf /tmp/dist.tar.gz -C /usr/share/nginx/html\",
      \"systemctl reload nginx\"
    ]" \
    --query "Command.CommandId" --output text)

  aws ssm wait command-executed \
    --region "$REGION" \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE"

  echo "Deployed to ${INSTANCE} (command ${COMMAND_ID})"
  DEPLOYED=$((DEPLOYED + 1))
done

if [ "$DEPLOYED" -eq 0 ]; then
  echo "::warning::Frontend build uploaded to S3 but no instances received SSM deploy."
  echo "::warning::Apply Terraform IAM/SSM changes, wait ~2 min for SSM agent, then re-run workflow."
  exit 0
fi

echo "Frontend SSM deploy complete on ${DEPLOYED} instance(s)."
