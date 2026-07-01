# IAM Policies Reference

This document describes the three IAM roles created by Terraform for the EMS application.

## 1. EC2 Backend Role (`ems-ec2-backend-role`)

**Trust Policy:** EC2 service

**Attached to:** Backend ASG instances via instance profile

| Permission | Resource | Purpose |
|-----------|----------|---------|
| `s3:GetObject`, `PutObject`, `DeleteObject`, `ListBucket` | Profile pictures bucket | Pre-signed URL profile picture storage |
| `secretsmanager:GetSecretValue` | `ems/rds/credentials` | Load DB credentials at runtime |
| `logs:CreateLogGroup/Stream`, `PutLogEvents` | CloudWatch Logs | Application logging |
| `cloudwatch:PutMetricData` | `EMS/Backend` namespace | Custom application metrics |

**No access keys** — credentials obtained automatically via instance metadata (IMDSv2).

## 2. Deployment Role (`ems-deployment-role`)

**Trust Policy:** CodeDeploy service

**Attached to:** CodeDeploy deployment group

| Permission | Purpose |
|-----------|---------|
| `codedeploy:*` | Manage deployments |
| `ec2:RunInstances`, `TerminateInstances` | Blue-green instance lifecycle |
| `autoscaling:*` | ASG integration |
| `elasticloadbalancing:ModifyListener/Rule` | Traffic shifting |
| `s3:GetObject` | Retrieve deployment artifacts |
| `sns:Publish` | Deployment notifications |

## 3. Monitoring Role (`ems-monitoring-role`)

**Trust Policy:** CloudWatch service

| Permission | Purpose |
|-----------|---------|
| `cloudwatch:DescribeAlarms`, `PutMetricAlarm` | Alarm management |
| `sns:Publish` | Send alert notifications |

## CI/CD IAM User (GitHub Actions)

Create a separate IAM user for GitHub Actions with least privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::ems-deploy-artifacts/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:CreateDeployment",
        "codedeploy:GetDeployment"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Best Practices Applied

- No IAM users for application runtime — roles only
- IMDSv2 required on all EC2 instances
- Least privilege per role
- Resource-scoped policies where possible
- CloudTrail logs all IAM API calls
