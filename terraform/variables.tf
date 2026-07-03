# Input variables — copy terraform.tfvars.example to terraform.tfvars
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
  default     = "ems"
}

variable "domain_name" {
  description = "Custom domain (e.g., employee.company.com)"
  type        = string
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone name (e.g., company.com). Used to look up the zone ID automatically."
  type        = string
}

variable "hosted_zone_id" {
  description = "Optional Route 53 hosted zone ID. If set, skips automatic zone lookup."
  type        = string
  default     = null
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "ems_admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password (use Secrets Manager in production)"
  type        = string
  sensitive   = true
}

variable "bastion_key_name" {
  description = "EC2 key pair name for bastion SSH access"
  type        = string
}

variable "alert_email" {
  description = "Email for SNS CloudWatch alerts"
  type        = string
}

variable "backend_instance_type" {
  description = "EC2 instance type for backend ASG"
  type        = string
  default     = "t3.medium"
}

variable "frontend_instance_type" {
  description = "EC2 instance type for frontend"
  type        = string
  default     = "t3.small"
}

variable "asg_min_size" {
  type    = number
  default = 2
}

variable "asg_max_size" {
  type    = number
  default = 6
}

variable "asg_desired_capacity" {
  type    = number
  default = 2
}
