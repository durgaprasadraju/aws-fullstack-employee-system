output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "application_url" {
  value = "https://${var.domain_name}"
}

output "rds_writer_endpoint" {
  value     = module.rds.writer_endpoint
  sensitive = true
}

output "rds_reader_endpoint" {
  value     = module.rds.reader_endpoint
  sensitive = true
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}

output "deploy_bucket_name" {
  description = "S3 bucket for GitHub Actions deployment artifacts — set as DEPLOY_BUCKET secret"
  value       = module.s3.deploy_bucket_name
}

output "codedeploy_app_name" {
  value = module.codedeploy.app_name
}

output "codedeploy_deployment_group_name" {
  description = "CodeDeploy deployment group — set as CODEDEPLOY_DG_NAME secret"
  value       = module.codedeploy.deployment_group_name
}

output "bastion_public_ip" {
  value = module.bastion.public_ip
}

output "cloudwatch_dashboard_name" {
  value = module.monitoring.dashboard_name
}
