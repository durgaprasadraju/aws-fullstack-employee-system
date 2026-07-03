#!/bin/bash
# Frontend EC2 user data — Nginx + SSM agent for CI/CD deploys
set -euo pipefail

dnf update -y
dnf install -y nginx aws-cli

mkdir -p /usr/share/nginx/html
echo '<html><body><h1>EMS Frontend - Deploy via CI/CD</h1></body></html>' > /usr/share/nginx/html/index.html

systemctl enable nginx amazon-ssm-agent
systemctl start nginx amazon-ssm-agent

echo "Frontend instance bootstrap complete"
