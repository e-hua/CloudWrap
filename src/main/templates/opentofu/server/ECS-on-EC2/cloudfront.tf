resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "/"

  origin {
    # Point directly at the EC2 instance's public DNS
    domain_name = aws_instance.ecs_instance.public_dns
    origin_id   = "ec2-origin"

    custom_origin_config {
      http_port              = var.container_port
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    # Layer 2: The "Secret Handshake"
    # Notice that your server have to manage the secret right now 
    # To reject any header that don't have the exact secret value 
    custom_header {
      name  = "X-CloudWrap-Secret"
      value = var.secret_header_value
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ec2-origin"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
