# CodePipeline needs to talk to ECS
# While CodeBuild needs to talk to ECR

# This is the "warehouse" for our Docker images
resource "aws_ecr_repository" "app_repo" {
  name = var.project_name
  force_delete = true
}

# This role allows CodePipeline to start CodeBuild and use S3
# Also telling ECS to deploy 
resource "aws_iam_role" "codepipeline_role" {
  name = "${var.project_name}-codepipeline-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "codepipeline.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "codepipeline_policy" {
  name = "${var.project_name}-codepipeline-policy"
  role = aws_iam_role.codepipeline_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { # Allow it to use S3 for artifacts
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.codepipeline_artifacts.arn}/*"
      },
      { # Allow it to start CodeBuild
        Effect = "Allow"
        Action = [
          "codebuild:StartBuild",
          "codebuild:BatchGetBuilds",
          "codebuild:ListBuildsForProject",
          "codebuild:StopBuild"
        ]
        Resource = aws_codebuild_project.main.arn
      },
      { # Allow it to read the source code
        Effect   = "Allow"
        Action   = "codestar-connections:UseConnection"
        Resource = var.github_connection_arn
      },
      {
        # --- (FIX 1: More specific ECS permissions) ---
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:UpdateService",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*" # You can lock this down to your specific service/cluster
      },
      {
        # --- (FIX 2: THE MISSING PIECE) ---
        # This allows CodePipeline to pass your task role to ECS
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.ecs_task_execution_role.arn
        # This allows the role to be passed ONLY to the ECS Tasks service
        Condition = {
          "StringEquals" = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      }
    ]
  })
}

# This role allows CodeBuild to build the project
resource "aws_iam_role" "codebuild_role" {
  name = "${var.project_name}-codebuild-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "codebuild.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "codebuild_policy" {
  name = "${var.project_name}-codebuild-policy"
  role = aws_iam_role.codebuild_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { # Allow it to write logs
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["*"]
      },
      { # Allow it to get/put pipeline artifacts
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.codepipeline_artifacts.arn}/*"
      },
      {
        # This statement allows the build role to get login credentials
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*" # This action MUST be on resource "*"
      },
      {
        # This statement allows the build role to push images
        # ONLY to the specific project repository
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = aws_ecr_repository.app_repo.arn
      }
    ]
  })
}
