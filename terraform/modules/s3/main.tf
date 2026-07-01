variable "project_name" { type = string }
variable "environment" { type = string }

# Private S3 bucket for employee profile pictures
resource "aws_s3_bucket" "profiles" {
  bucket = "${var.project_name}-profile-pictures-${var.environment}"

  tags = { Name = "${var.project_name}-profiles" }
}

resource "aws_s3_bucket_public_access_block" "profiles" {
  bucket = aws_s3_bucket.profiles.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "profiles" {
  bucket = aws_s3_bucket.profiles.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "profiles" {
  bucket = aws_s3_bucket.profiles.id
  versioning_configuration { status = "Enabled" }
}

# CloudTrail log bucket
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.project_name}-cloudtrail-${var.environment}"
  tags   = { Name = "${var.project_name}-cloudtrail" }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AWSCloudTrailAclCheck"
      Effect    = "Allow"
      Principal = { Service = "cloudtrail.amazonaws.com" }
      Action    = "s3:GetBucketAcl"
      Resource  = aws_s3_bucket.cloudtrail.arn
    }, {
      Sid       = "AWSCloudTrailWrite"
      Effect    = "Allow"
      Principal = { Service = "cloudtrail.amazonaws.com" }
      Action    = "s3:PutObject"
      Resource  = "${aws_s3_bucket.cloudtrail.arn}/*"
      Condition = { StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" } }
    }]
  })
}

output "bucket_name" { value = aws_s3_bucket.profiles.bucket }
output "bucket_arn" { value = aws_s3_bucket.profiles.arn }
output "cloudtrail_bucket_name" { value = aws_s3_bucket.cloudtrail.bucket }
