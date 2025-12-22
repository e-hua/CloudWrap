# The "setup" file: configures the provider and state backend.
provider "aws" {
  region = var.aws_region
  # The AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY will be injected automatically
  assume_role {
    role_arn = var.execution_role_arn
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}
