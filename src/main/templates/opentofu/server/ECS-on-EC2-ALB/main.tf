# --- 1. Get Your Default VPC and Public Subnets ---
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# --- 2. Security Group "Bouncers" ---

# Security group for the ALB (internet-facing)
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg"
  vpc_id      = data.aws_vpc.default.id
  description = "Allow HTTP traffic from anywhere"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group for the EC2 Instance (private)
resource "aws_security_group" "ecs_instance_sg" {
  name        = "${var.project_name}-instance-sg"
  vpc_id      = data.aws_vpc.default.id
  description = "Allow traffic ONLY from the ALB"

  # This is the key rule: only allow traffic from our ALB
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- 3. The Application Load Balancer (ALB) ---
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false # Internet-facing
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = data.aws_subnets.default.ids # Use all default public subnets
}

resource "aws_lb_target_group" "main" {
  name        = "${var.project_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "instance"
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Default action: Block all traffic
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Forbidden: Access only allowed via CloudFront"
      status_code  = 403
    }
  }
}

# The "Secret Handshake" Rule
resource "aws_lb_listener_rule" "allow_cloudfront" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  condition {
    http_header {
      http_header_name = "X-CloudWrap-Secret"
      values           = [var.secret_header_value]
    }
  }
}

# --- 4. The ECS Cluster and EC2 Instance ---
resource "aws_ecs_cluster" "main" {
  name = var.project_name
}

data "aws_ami" "ecs_optimized" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
}

resource "aws_instance" "ecs_instance" {
  ami           = data.aws_ami.ecs_optimized.id
  instance_type = var.instance_type
  subnet_id     = data.aws_subnets.default.ids[0] # Put in a default public subnet

  # Assign our private security group
  vpc_security_group_ids = [aws_security_group.ecs_instance_sg.id]

  # We need a public IP to pull the ECS agent and Docker images
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ecs_instance_profile.name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${var.project_name} >> /etc/ecs/ecs.config
              EOF
  )
}
