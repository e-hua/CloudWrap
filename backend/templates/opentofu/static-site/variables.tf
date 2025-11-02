# The "inputs" file: defines all parameters.
variable "aws_region" {
  type        = string
  description = "The AWS region where resources will be created."
  default     = "us-east-1"
}

variable "bucket_name" {
  type        = string
  description = "The globally unique name for the S3 bucket."
}

variable "domain_name" {
  type        = string
  description = "The custom domain name for the website (e.g., myapp.example.com)."
  default     = null
}

variable "acm_certificate_arn" {
  type        = string
  description = "The ARN of the ACM certificate for the custom domain (must be in us-east-1 for CloudFront)."
  default     = null
}

variable "execution_role_arn" {
  type        = string
  description = "The ARN of the IAM role for OpenTofu to assume."
}
