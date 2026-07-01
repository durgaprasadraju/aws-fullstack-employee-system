#!/bin/bash
# CodeDeploy AfterInstall hook — install dependencies and configure
set -euo pipefail

cd /opt/ems-backend

echo "AfterInstall: Installing production dependencies..."
npm ci --production

# Restore logs if backed up
if [ -d /tmp/ems-logs-backup ]; then
  cp -r /tmp/ems-logs-backup/* logs/ 2>/dev/null || true
  rm -rf /tmp/ems-logs-backup
fi

# Set ownership
chown -R node:node /opt/ems-backend
