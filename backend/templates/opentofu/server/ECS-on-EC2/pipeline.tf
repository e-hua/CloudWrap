# Artifact S3 bucket for the pipeline
resource "aws_s3_bucket" "codepipeline_artifacts" {
  bucket = "${var.project_name}-pipeline-artifacts-${data.aws_caller_identity.current.account_id}"
}

# Data source to get current account ID (for ECR URI)
data "aws_caller_identity" "current" {}

# This is the "Build Server" configuration
resource "aws_codebuild_project" "main" {
  name         = "${var.project_name}-build"
  service_role = aws_iam_role.codebuild_role.arn

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ECR_REPO_URI"
      value = aws_ecr_repository.app_repo.repository_url
    }
  }

  source {
    type = "CODEPIPELINE"

    # --- HERE IS THE FIX ---
    # We are now single-quoting every command to force YAML to
    # treat it as a literal string.
    buildspec = <<-EOF
      version: 0.2
      phases:
        pre_build:
          commands:
            - 'echo "Logging in to Amazon ECR..."'
            - 'aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com'
            - 'echo "Changing to root directory: ${var.root_directory}"'
            - 'cd ${var.root_directory}'
        build:
          commands:
            - 'echo "Build started on $(date)"'
            - 'echo "Building the Docker image from ${var.dockerfile_path}..."'
            - 'docker build -t $ECR_REPO_URI:latest -f ${var.dockerfile_path} .'
            - 'docker tag $ECR_REPO_URI:latest $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION'
        post_build:
          commands:
            - 'echo "Build completed on $(date)"'
            - 'echo "Pushing the Docker images to ECR..."'
            - 'docker push $ECR_REPO_URI:latest'
            - 'docker push $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION'
            # We must escape the inner single quotes by doubling them
            - 'printf ''[{"name":"${var.project_name}","imageUri":"%s"}]'' "$ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION" > imagedefinitions.json'
      artifacts:
        files:
          - imagedefinitions.json
    EOF
    # --- END OF FIX ---
  }

  artifacts {
    type = "CODEPIPELINE"
  }
}

# This is the "Orchestrator" that connects everything
resource "aws_codepipeline" "main" {
  name     = "${var.project_name}-pipeline"
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
        ConnectionArn    = var.github_connection_arn
        FullRepositoryId = var.github_repo_id
        BranchName       = var.github_branch_name
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
      output_artifacts = ["build_output"] # Contains the imagedefinitions.json
      configuration = {
        ProjectName = aws_codebuild_project.main.name
      }
    }
  }

  # --- STAGE 3: Deploy (Deploys to ECS) ---
  stage {
    name = "Deploy"
    action {
      name            = "Deploy"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS" # This is the key change
      version         = "1"
      input_artifacts = ["build_output"]
      configuration = {
        ClusterName = aws_ecs_cluster.main.name # From compute.tf
        ServiceName = aws_ecs_service.main.name # From service.tf
        FileName    = "imagedefinitions.json"   # The "shipping label"
      }
    }
  }
}
