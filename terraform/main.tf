# Root Terraform configuration for Employee Management System
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state in production
  # backend "s3" {
  #   bucket         = "ems-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "ems-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "employee-management-system"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "main" {
  count        = var.hosted_zone_id == null ? 1 : 0
  name         = var.route53_zone_name
  private_zone = false
}

locals {
  hosted_zone_id = coalesce(var.hosted_zone_id, data.aws_route53_zone.main[0].zone_id)
}

# --- Infrastructure Modules ---

module "vpc" {
  source = "./modules/vpc"

  vpc_cidr     = var.vpc_cidr
  project_name = var.project_name
}

module "security_groups" {
  source = "./modules/security-groups"

  vpc_id   = module.vpc.vpc_id
  vpc_cidr = var.vpc_cidr
}

module "iam" {
  source = "./modules/iam"

  project_name      = var.project_name
  s3_bucket_arn     = module.s3.bucket_arn
  deploy_bucket_arn = module.s3.deploy_bucket_arn
  db_secret_arn     = module.secrets.db_secret_arn
}

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  db_username  = var.db_username
  db_password  = var.db_password
}

module "rds" {
  source = "./modules/rds"

  project_name         = var.project_name
  db_subnet_group_name = module.vpc.db_subnet_group_name
  security_group_ids   = [module.security_groups.rds_sg_id]
  db_username          = var.db_username
  db_password          = var.db_password
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = module.secrets.db_secret_id
  secret_string = jsonencode({
    username   = var.db_username
    password   = var.db_password
    host       = module.rds.writer_endpoint
    readerHost = module.rds.reader_endpoint
    port       = 3306
    dbname     = "employee_management"
  })
}

module "alb" {
  source = "./modules/alb"

  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_sg_id
  domain_name           = var.domain_name
  certificate_arn       = module.acm.certificate_arn
}

module "acm" {
  source = "./modules/acm"

  domain_name    = var.domain_name
  hosted_zone_id = local.hosted_zone_id
}

module "route53" {
  source = "./modules/route53"

  domain_name    = var.domain_name
  hosted_zone_id = local.hosted_zone_id
  alb_dns_name   = module.alb.alb_dns_name
  alb_zone_id    = module.alb.alb_zone_id
}

module "bastion" {
  source = "./modules/bastion"

  project_name     = var.project_name
  public_subnet_id = module.vpc.public_subnet_ids[0]
  bastion_sg_id    = module.security_groups.bastion_sg_id
  key_name         = var.bastion_key_name
  instance_type    = "t3.micro"
}

module "asg" {
  source = "./modules/asg"

  project_name              = var.project_name
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  backend_security_group_id = module.security_groups.backend_sg_id
  instance_profile_name     = module.iam.ec2_backend_instance_profile_name
  instance_type             = var.backend_instance_type
  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  target_group_arn          = module.alb.backend_target_group_arn
  aws_region                = var.aws_region
}

module "frontend" {
  source = "./modules/frontend-ec2"

  project_name               = var.project_name
  public_subnet_ids          = module.vpc.public_subnet_ids
  frontend_security_group_id = module.security_groups.frontend_sg_id
  instance_type              = var.frontend_instance_type
  key_name                   = var.bastion_key_name
  instance_profile_name      = module.iam.ec2_frontend_instance_profile_name
  deploy_bucket_name         = module.s3.deploy_bucket_name
  aws_region                 = var.aws_region
  target_group_arn           = module.alb.frontend_target_group_arn
}

module "codedeploy" {
  source = "./modules/codedeploy"

  project_name              = var.project_name
  deployment_role_arn       = module.iam.deployment_role_arn
  asg_name                  = module.asg.asg_name
  backend_target_group_name = module.alb.backend_target_group_name
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name    = var.project_name
  alert_email     = var.alert_email
  asg_name        = module.asg.asg_name
  alb_arn_suffix  = module.alb.alb_arn_suffix
  rds_instance_id = module.rds.instance_id
  sns_topic_arn   = module.iam.monitoring_sns_topic_arn
}

resource "aws_cloudtrail" "main" {
  name                          = "${var.project_name}-cloudtrail"
  s3_bucket_name                = module.s3.cloudtrail_bucket_name
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  tags = { Name = "${var.project_name}-cloudtrail" }
}
