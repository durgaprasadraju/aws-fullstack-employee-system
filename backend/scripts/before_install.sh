#!/bin/bash
# CodeDeploy BeforeInstall hook — stop existing service and clean up
set -euo pipefail

echo "BeforeInstall: Stopping existing backend service..."
systemctl stop ems-backend 2>/dev/null || true

# Preserve logs from previous deployment
if [ -d /opt/ems-backend/logs ]; then
  cp -r /opt/ems-backend/logs /tmp/ems-logs-backup 2>/dev/null || true
fi
