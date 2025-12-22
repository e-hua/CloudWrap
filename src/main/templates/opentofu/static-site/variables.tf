# The "inputs" file: defines all parameters.
variable "aws_region" {
  type        = string
  description = "The AWS region where resources will be created."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "The name for the project."
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

variable "github_repo_id" {
  type        = string
  description = "The repository ID (e.g., 'e-hua/cloudwrap')."
}

variable "github_branch_name" {
  type        = string
  description = "The branch name (e.g., 'dev' or 'main')."
}

variable "github_connection_arn" {
  type        = string
  description = "The ARN of the CodeStar connection."
}

variable "root_directory" {
  type        = string
  description = "The directory to run commands from. Defaults to repo root."
  default     = null # A null default makes it optional
}

variable "build_command" {
  type        = string
  description = "The command to run to build the site."
  default     = "npm run build"
}

variable "publish_directory" {
  type        = string
  description = "The path to the built assets, relative to the repo root."
  default     = "dist"
}
