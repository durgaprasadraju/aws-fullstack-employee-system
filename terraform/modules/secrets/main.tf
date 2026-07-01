variable "project_name" { type = string }
variable "db_username" { type = string }
variable "db_password" { type = string }

resource "aws_secretsmanager_secret" "db" {
  name                    = "${var.project_name}/rds/credentials"
  description             = "RDS MySQL credentials for EMS"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "initial" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username   = var.db_username
    password   = var.db_password
    host       = "pending-rds-provision"
    readerHost = "pending-rds-provision"
    port       = 3306
    dbname     = "employee_management"
  })

  lifecycle { ignore_changes = [secret_string] }
}

output "db_secret_id" { value = aws_secretsmanager_secret.db.id }
output "db_secret_arn" { value = aws_secretsmanager_secret.db.arn }
