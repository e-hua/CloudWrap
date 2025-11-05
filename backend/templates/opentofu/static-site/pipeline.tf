# This data source fetches information about the current AWS user/role
data "aws_caller_identity" "current" {}

# This is the "workspace" S3 bucket for the pipeline
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket = "${var.project_name}-pipeline-artifacts-${data.aws_caller_identity.current.account_id}"
}

# This is the "Build Server" configuration
resource "aws_codebuild_project" "main" {
  name         = "${var.project_name}-build"
  service_role = aws_iam_role.codebuild_role.arn

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/standard:7.0"
    type         = "LINUX_CONTAINER"
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<-EOF
      version: 0.2
      phases:
        install:
          runtime-versions:
            nodejs: 18 # You could also make this a variable
          commands:
            # If a root_directory is set, cd into it
            - ${var.root_directory != null ? "cd ${var.root_directory}" : "echo 'Building from repo root.'"}
            - echo "Installing dependencies..."
            - npm install
        build:
          commands:
            - echo "Running build command..."
            - ${var.build_command}
      artifacts:
        files:
          - '**/*'
        # The base-directory must be relative to the repo root
        base-directory: ${var.root_directory != null ? "${var.root_directory}/${var.publish_directory}" : var.publish_directory}
    EOF
  }

  artifacts {
    type = "CODEPIPELINE"
  }
}

# This is the "Orchestrator" that connects everything
resource "aws_codepipeline" "main" {
  name     = var.project_name
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    type     = "S3"
    location = aws_s3_bucket.codepipeline_artifacts.id
  }

  # --- STAGE 1: Source (Triggered by git push) ---
  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = var.github_connection_arn # From the one-time SDK handshake
        FullRepositoryId = var.github_repo_id        # e.g., "e-hua/cloudwrap"
        BranchName       = var.github_branch_name    # e.g., "dev" or "main"
      }
    }
  }

  # --- STAGE 2: Build (Runs CodeBuild) ---
  stage {
    name = "Build"
    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.main.name
      }
    }
  }

  # --- STAGE 3: Deploy (Syncs to your S3 website) ---
  stage {
    name = "Deploy"
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "S3"
      version         = "1"
      input_artifacts = ["build_output"]

      configuration = {
        # This is the S3 bucket created by your static-site.tf!
        BucketName = aws_s3_bucket.website_bucket.id
        Extract    = "true" # Unzips the artifact
      }
    }
  }
}
