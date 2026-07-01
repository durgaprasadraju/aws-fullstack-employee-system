variable "project_name" { type = string }
variable "db_subnet_group_name" { type = string }
variable "security_group_ids" { type = list(string) }
variable "db_username" { type = string }
variable "db_password" { type = string }

resource "aws_db_parameter_group" "mysql" {
  family = "mysql8.0"
  name   = "${var.project_name}-mysql-params"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }
}

# RDS MySQL with Multi-AZ and read replica for reader endpoint
resource "aws_db_instance" "writer" {
  identifier     = "${var.project_name}-mysql-writer"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.medium"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "employee_management"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.security_group_ids
  parameter_group_name   = aws_db_parameter_group.mysql.name

  multi_az               = true
  publicly_accessible    = false
  deletion_protection    = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "${var.project_name}-mysql-final-snapshot"

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  enabled_cloudwatch_logs_exports = ["error", "slowquery", "general"]

  tags = { Name = "${var.project_name}-mysql-writer" }
}

# Read replica — serves as the reader endpoint for SELECT queries
resource "aws_db_instance" "reader" {
  identifier          = "${var.project_name}-mysql-reader"
  replicate_source_db = aws_db_instance.writer.identifier
  instance_class      = "db.t3.medium"

  publicly_accessible = false
  skip_final_snapshot = true

  tags = { Name = "${var.project_name}-mysql-reader" }
}

output "writer_endpoint" { value = aws_db_instance.writer.address }
output "reader_endpoint" { value = aws_db_instance.reader.address }
output "instance_id" { value = aws_db_instance.writer.id }
