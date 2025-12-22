locals {
  custom_domain_enabled = var.domain_name != null && var.acm_certificate_arn != null
}

# --- 1. S3 Bucket for Website Files ---
# We create a standard S3 bucket.
resource "aws_s3_bucket" "website_bucket" {
  bucket = var.bucket_name
  force_destroy = true
}

# --- 2. Block All Public Access to the Bucket ---
# This is a critical security step. We are explicitly ensuring
# that no one can access the bucket directly via its S3 URL.
resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- 3. Create a Special Identity for CloudFront ---
# This "Origin Access Identity" is like a special, limited IAM user
# that only CloudFront can use to access our private S3 bucket.
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.bucket_name}"
}

# --- 4. Create a Bucket Policy to Allow the CloudFront Identity ---
# This policy is attached to the S3 bucket. It says:
# "Only allow the specific OAI we just created to read files from this bucket."
data "aws_iam_policy_document" "allow_cloudfront_oai" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.website_bucket.arn}/*"] # All files in the bucket

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.oai.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "allow_oai_policy" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = data.aws_iam_policy_document.allow_cloudfront_oai.json
}


# --- 5. Create the CloudFront Distribution ---
# This is the main resource. It's the global network of edge servers.
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html"

  # Only enable the aliases when the domain is passed in
  aliases = local.custom_domain_enabled ? [var.domain_name] : []

  # This section defines the "origin" - where CloudFront gets its files.
  origin {
    domain_name = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id   = "S3-${var.bucket_name}"

    # This links the S3 origin to the special identity (OAI).
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  # This section defines how CloudFront behaves.
  default_cache_behavior {
    target_origin_id       = "S3-${var.bucket_name}"
    viewer_protocol_policy = "redirect-to-https" # Always use HTTPS
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # BLOCK 1: Only runs IF a custom domain is provided.
  dynamic "viewer_certificate" {
    for_each = local.custom_domain_enabled ? [1] : []
    content {
      acm_certificate_arn      = var.acm_certificate_arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = "TLSv1.2_2021"
    }
  }

  # BLOCK 2: Only runs IF NO custom domain is provided.
  dynamic "viewer_certificate" {
    for_each = !local.custom_domain_enabled ? [1] : []
    content {
      # This tells CloudFront to use its default certificate.
      cloudfront_default_certificate = true
    }
  }

  # Standard restrictions.
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
