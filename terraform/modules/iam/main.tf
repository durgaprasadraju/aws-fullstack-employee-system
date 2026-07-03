variable "project_name" { type = string }
variable "s3_bucket_arn" { type = string }
variable "deploy_bucket_arn" { type = string }
variable "db_secret_arn" { type = string }

# --- 1. EC2 Backend Role ---
resource "aws_iam_role" "ec2_backend" {
  name = "${var.project_name}-ec2-backend-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ec2_backend" {
  name = "${var.project_name}-ec2-backend-policy"
  role = aws_iam_role.ec2_backend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ProfilePictures"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [var.s3_bucket_arn, "${var.s3_bucket_arn}/*"]
      },
      {
        Sid      = "SecretsManagerRead"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [var.db_secret_arn]
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = ["arn:aws:logs:*:*:*"]
      },
      {
        Sid      = "CloudWatchMetrics"
        Effect   = "Allow"
        Action   = ["cloudwatch:PutMetricData"]
        Resource = ["*"]
        Condition = {
          StringEquals = { "cloudwatch:namespace" = "EMS/Backend" }
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_backend" {
  name = "${var.project_name}-ec2-backend-profile"
  role = aws_iam_role.ec2_backend.name
}

# --- 1b. EC2 Frontend Role (SSM deploy + S3 artifact read) ---
resource "aws_iam_role" "ec2_frontend" {
  name = "${var.project_name}-ec2-frontend-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_frontend_ssm" {
  role       = aws_iam_role.ec2_frontend.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "ec2_frontend" {
  name = "${var.project_name}-ec2-frontend-policy"
  role = aws_iam_role.ec2_frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "DeployArtifactsRead"
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = [var.deploy_bucket_arn, "${var.deploy_bucket_arn}/*"]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_frontend" {
  name = "${var.project_name}-ec2-frontend-profile"
  role = aws_iam_role.ec2_frontend.name
}

# --- 2. Deployment Role (CodeDeploy) ---
resource "aws_iam_role" "deployment" {
  name = "${var.project_name}-deployment-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "codedeploy.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "deployment" {
  name = "${var.project_name}-deployment-policy"
  role = aws_iam_role.deployment.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CodeDeploy"
        Effect = "Allow"
        Action = [
          "codedeploy:*",
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:DescribeInstances",
          "ec2:DescribeInstanceStatus",
          "autoscaling:CompleteLifecycleAction",
          "autoscaling:DeleteLifecycleHook",
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeLifecycleHooks",
          "autoscaling:PutLifecycleHook",
          "autoscaling:RecordLifecycleActionHeartbeat",
          "elasticloadbalancing:DescribeTargetGroups",
          "elasticloadbalancing:DescribeListeners",
          "elasticloadbalancing:ModifyListener",
          "elasticloadbalancing:DescribeRules",
          "elasticloadbalancing:ModifyRule",
          "lambda:InvokeFunction",
          "sns:Publish",
          "cloudwatch:DescribeAlarms",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = ["*"]
      }
    ]
  })
}

# --- 3. Monitoring Role ---
resource "aws_iam_role" "monitoring" {
  name = "${var.project_name}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "cloudwatch.amazonaws.com" }
    }]
  })
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
}

resource "aws_iam_role_policy" "monitoring" {
  name = "${var.project_name}-monitoring-policy"
  role = aws_iam_role.monitoring.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatch"
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics"
        ]
        Resource = ["*"]
      },
      {
        Sid      = "SNSPublish"
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [aws_sns_topic.alerts.arn]
      }
    ]
  })
}

output "ec2_backend_instance_profile_name" { value = aws_iam_instance_profile.ec2_backend.name }
output "ec2_frontend_instance_profile_name" { value = aws_iam_instance_profile.ec2_frontend.name }
output "deployment_role_arn" { value = aws_iam_role.deployment.arn }
output "monitoring_sns_topic_arn" { value = aws_sns_topic.alerts.arn }
