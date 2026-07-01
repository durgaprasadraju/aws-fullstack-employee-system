variable "vpc_id" { type = string }
variable "vpc_cidr" { type = string }

# ALB — accepts HTTP/HTTPS from internet
resource "aws_security_group" "alb" {
  name_prefix = "alb-"
  vpc_id      = var.vpc_id
  description = "ALB security group"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "alb-sg" }

  lifecycle { create_before_destroy = true }
}

# Backend EC2 — only from ALB
resource "aws_security_group" "backend" {
  name_prefix = "backend-"
  vpc_id      = var.vpc_id
  description = "Backend EC2 security group"

  ingress {
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "backend-sg" }
  lifecycle { create_before_destroy = true }
}

# Frontend EC2 — only from ALB
resource "aws_security_group" "frontend" {
  name_prefix = "frontend-"
  vpc_id      = var.vpc_id
  description = "Frontend EC2 security group"

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "frontend-sg" }
  lifecycle { create_before_destroy = true }
}

# RDS — only from backend
resource "aws_security_group" "rds" {
  name_prefix = "rds-"
  vpc_id      = var.vpc_id
  description = "RDS MySQL security group"

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.backend.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "rds-sg" }
  lifecycle { create_before_destroy = true }
}

# Bastion — SSH from restricted IPs (update CIDR for your office/VPN)
resource "aws_security_group" "bastion" {
  name_prefix = "bastion-"
  vpc_id      = var.vpc_id
  description = "Bastion host security group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict to your IP in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "bastion-sg" }
  lifecycle { create_before_destroy = true }
}

output "alb_sg_id" { value = aws_security_group.alb.id }
output "backend_sg_id" { value = aws_security_group.backend.id }
output "frontend_sg_id" { value = aws_security_group.frontend.id }
output "rds_sg_id" { value = aws_security_group.rds.id }
output "bastion_sg_id" { value = aws_security_group.bastion.id }
