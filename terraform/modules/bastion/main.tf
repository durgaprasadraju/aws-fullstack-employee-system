variable "project_name" { type = string }
variable "public_subnet_id" { type = string }
variable "bastion_sg_id" { type = string }
variable "key_name" { type = string }
variable "instance_type" { type = string }

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = var.public_subnet_id
  vpc_security_group_ids = [var.bastion_sg_id]

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required" # IMDSv2
  }

  root_block_device {
    volume_size = 30
    encrypted   = true
  }

  tags = { Name = "${var.project_name}-bastion" }
}

output "public_ip" { value = aws_instance.bastion.public_ip }
output "instance_id" { value = aws_instance.bastion.id }
