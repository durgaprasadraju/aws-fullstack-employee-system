#!/bin/bash
# Frontend EC2 bootstrap — Nginx SPA + pull React build from S3 deploy bucket
set -euo pipefail

DEPLOY_BUCKET="${deploy_bucket}"
AWS_REGION="${aws_region}"

dnf update -y
dnf install -y nginx aws-cli

mkdir -p /usr/share/nginx/html
cat > /etc/nginx/conf.d/ems-frontend.conf << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

rm -f /etc/nginx/conf.d/default.conf
systemctl enable nginx amazon-ssm-agent

deploy_frontend() {
  aws s3 cp "s3://$DEPLOY_BUCKET/frontend/dist.tar.gz" /tmp/dist.tar.gz --region "$AWS_REGION"
  rm -rf /usr/share/nginx/html/*
  tar -xzf /tmp/dist.tar.gz -C /usr/share/nginx/html
  rm -f /tmp/dist.tar.gz
}

# Retry — CI may upload the artifact shortly after instances launch
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  if deploy_frontend 2>/dev/null; then
    echo "Frontend app deployed from S3 on attempt $attempt"
    systemctl restart nginx
    systemctl start amazon-ssm-agent || true
    echo "Frontend instance bootstrap complete"
    exit 0
  fi
  echo "Waiting for frontend artifact in S3 (attempt $attempt/10)..."
  sleep 30
done

echo '<html><body><h1>EMS Frontend loading...</h1><p>Run: bash scripts/publish-frontend.sh --ssm</p></body></html>' \
  > /usr/share/nginx/html/index.html
systemctl start nginx amazon-ssm-agent || true
echo "Frontend placeholder active — publish React build to S3 to show login screen"
