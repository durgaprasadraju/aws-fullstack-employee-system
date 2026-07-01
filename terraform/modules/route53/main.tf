variable "domain_name" { type = string }
variable "hosted_zone_id" { type = string }
variable "alb_dns_name" { type = string }
variable "alb_zone_id" { type = string }

# Alias record pointing to ALB
resource "aws_route53_record" "app" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
