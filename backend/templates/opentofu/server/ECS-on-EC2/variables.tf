
variable "aws_region" {
  type        = string
  description = "The AWS region where resources will be created."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "The project name for your app(e.g. CloudWrap)."
}

variable "execution_role_arn" {
  type        = string
  description = "The ARN of the IAM role for OpenTofu to assume."
}

variable "image_uri" {
  type        = string
  description = "The dummy container image from ECR to trigger the first deploy."
  # It will deployed in the initial deployment, so it's ok to make it any valid URI
  default = "nginx:latest"
}

variable "container_port" {
  type        = number
  description = "The port the application listens on inside the container."
}

variable "instance_type" {
  type        = string
  description = "The EC2 instance type to use."
  default     = "t3.nano"
}

variable "secret_header_value" {
  type        = string
  description = "A secret value for the X-CloudWrap-Secret header."
  sensitive   = true
}

variable "github_repo_id" {
  type        = string
  description = "The repository ID (e.g., 'e-hua/CloudWrap')."
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
  default     = "."
}

variable "dockerfile_path" {
  type        = string
  description = "Path to the Dockerfile, relative to the root_directory"
  default     = "Dockerfile"
}
