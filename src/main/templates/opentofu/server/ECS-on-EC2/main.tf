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

# --- 2. Security Group ---
# We ONLY need one security group now.
resource "aws_security_group" "ecs_instance_sg" {
  name        = "${var.project_name}-instance-sg"
  vpc_id      = data.aws_vpc.default.id
  description = "Allow public traffic to the container port"

  # This is the key change. We now allow traffic from ANYWHERE,
  # because we trust the application to check the secret header.
  ingress {
    from_port   = var.container_port
    to_port     = var.container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # <-- Allow public traffic
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- 3. ALL ALB RESOURCES ARE GONE ---

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
  subnet_id     = data.aws_subnets.default.ids[0]

  # Assign our new, simpler security group
  vpc_security_group_ids = [aws_security_group.ecs_instance_sg.id]

  # We still need a public IP so CloudFront can find it
  associate_public_ip_address = true

  iam_instance_profile = aws_iam_instance_profile.ecs_instance_profile.name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo ECS_CLUSTER=${var.project_name} >> /etc/ecs/ecs.config
              EOF
  )
}
