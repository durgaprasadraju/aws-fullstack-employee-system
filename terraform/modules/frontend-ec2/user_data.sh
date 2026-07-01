#!/bin/bash
# Frontend EC2 user data — install Nginx and deploy static files placeholder
set -euo pipefail

dnf update -y
dnf install -y nginx

# Placeholder — actual files deployed via CI/CD
mkdir -p /usr/share/nginx/html
echo '<html><body><h1>EMS Frontend - Deploy via CI/CD</h1></body></html>' > /usr/share/nginx/html/index.html

systemctl enable nginx
systemctl start nginx

echo "Frontend instance bootstrap complete"
