
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
  description = "The container image from ECR to deploy."
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
