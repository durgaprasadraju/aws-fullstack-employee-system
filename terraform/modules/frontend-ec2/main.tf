variable "project_name" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "frontend_security_group_id" { type = string }
variable "instance_type" { type = string }
variable "key_name" { type = string }
variable "target_group_arn" { type = string }
variable "instance_profile_name" { type = string }
variable "deploy_bucket_name" { type = string }
variable "aws_region" { type = string }

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# Frontend EC2 instances with Nginx (one per AZ for HA)
resource "aws_instance" "frontend" {
  count = length(var.public_subnet_ids)

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  iam_instance_profile   = var.instance_profile_name
  subnet_id              = var.public_subnet_ids[count.index]
  vpc_security_group_ids = [var.frontend_security_group_id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    deploy_bucket = var.deploy_bucket_name
    aws_region    = var.aws_region
  }))

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_size = 30
    encrypted   = true
  }

  tags = { Name = "${var.project_name}-frontend-${count.index + 1}" }
}

resource "aws_lb_target_group_attachment" "frontend" {
  count            = length(aws_instance.frontend)
  target_group_arn = var.target_group_arn
  target_id        = aws_instance.frontend[count.index].id
  port             = 80
}

output "instance_ids" { value = aws_instance.frontend[*].id }
