#!/bin/bash
# CodeDeploy ValidateService hook — verify health endpoint responds
set -euo pipefail

MAX_RETRIES=30
RETRY_INTERVAL=5

echo "ValidateService: Checking backend health..."

for i in $(seq 1 $MAX_RETRIES); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/health || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "Health check passed on attempt $i"
    exit 0
  fi

  echo "Attempt $i/$MAX_RETRIES: HTTP $HTTP_STATUS — retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1
