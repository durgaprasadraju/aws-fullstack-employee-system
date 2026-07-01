#!/bin/bash
# CodeDeploy ApplicationStart hook — start the backend service
set -euo pipefail

echo "ApplicationStart: Starting EMS backend service..."
systemctl daemon-reload
systemctl enable ems-backend
systemctl start ems-backend
