#!/bin/bash
# Backend EC2 user data — install Node.js, CodeDeploy agent, CloudWatch agent
set -euo pipefail

PROJECT_NAME="${project_name}"

# System updates
dnf update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# Install CodeDeploy agent
dnf install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install
chmod +x ./install
./install auto
systemctl enable codedeploy-agent
systemctl start codedeploy-agent

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Create application directory
mkdir -p /opt/ems-backend/logs
useradd -r -s /bin/false node 2>/dev/null || true
chown -R node:node /opt/ems-backend

# Systemd service for backend
cat > /etc/systemd/system/ems-backend.service << 'EOF'
[Unit]
Description=EMS Backend API
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/ems-backend
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=AWS_REGION=us-east-1
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ems-backend

# CloudWatch agent config
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/ems-backend/logs/combined.log",
            "log_group_name": "/ems/backend",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "Backend instance bootstrap complete"
