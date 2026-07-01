variable "project_name" { type = string }
variable "deployment_role_arn" { type = string }
variable "asg_name" { type = string }
variable "backend_target_group_name" { type = string }

resource "aws_codedeploy_app" "main" {
  name             = "${var.project_name}-app"
  compute_platform = "Server"
}

resource "aws_codedeploy_deployment_group" "backend" {
  app_name              = aws_codedeploy_app.main.name
  deployment_group_name = "${var.project_name}-backend-dg"
  service_role_arn      = var.deployment_role_arn

  autoscaling_groups = [var.asg_name]

  deployment_style {
    deployment_type   = "BLUE_GREEN"
    deployment_option = "WITH_TRAFFIC_CONTROL"
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 5
    }
  }

  load_balancer_info {
    target_group_info {
      name = var.backend_target_group_name
    }
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
}

output "app_name" { value = aws_codedeploy_app.main.name }
output "deployment_group_name" { value = aws_codedeploy_deployment_group.backend.deployment_group_name }
