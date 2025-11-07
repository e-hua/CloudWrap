resource "aws_ecs_task_definition" "app" {
  family                   = var.project_name
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = var.project_name
      image     = var.image_uri
      essential = true
      portMappings = [{
        containerPort = var.container_port
        hostPort      = var.container_port
      }]
      memory = 300
      cpu    = 128
    }
  ])
}

resource "aws_ecs_service" "main" {
  name            = var.project_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "EC2"
  desired_count   = 1

  # Force ECS to stop the old task before starting the new one
  deployment_maximum_percent         = 100 # Do not run more than 1 task
  deployment_minimum_healthy_percent = 0   # Allow the service to drop to 0 tasks briefly

  # Connect this service to our Load Balancer
  depends_on = [aws_instance.ecs_instance]
}
