data "aws_availability_zones" "available" { state = "available" }
data "aws_ssm_parameter" "al2023_arm" { name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64" }

resource "random_password" "k3s_token" {
  length  = 36
  special = false
}

resource "aws_vpc" "this" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "${var.project}-vpc" }
}
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.project}-igw" }
}
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.42.10.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project}-public" }
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
}
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "k3s" {
  name_prefix = "${var.project}-k3s-"
  vpc_id      = aws_vpc.this.id
  ingress {
    description = "SSH deployment"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }
  ingress {
    description = "Game HTTP"
    from_port   = 30080
    to_port     = 30080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "K3s cluster traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.project}-k3s" }
}

locals {
  common = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    dnf update -y
  EOT
  master_user_data = <<-EOT
    ${local.common}
    curl -sfL https://get.k3s.io | K3S_TOKEN='${random_password.k3s_token.result}' INSTALL_K3S_EXEC='server --write-kubeconfig-mode 644 --disable traefik' sh -
  EOT
}

resource "aws_instance" "master" {
  ami                    = data.aws_ssm_parameter.al2023_arm.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  key_name               = var.key_name
  user_data              = local.master_user_data
  tags                   = { Name = "${var.project}-master", Role = "k3s-control-plane" }
}

resource "aws_instance" "worker" {
  count                  = 2
  ami                    = data.aws_ssm_parameter.al2023_arm.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  key_name               = var.key_name
  user_data              = <<-EOT
    ${local.common}
    until timeout 1 bash -c '</dev/tcp/${aws_instance.master.private_ip}/6443'; do sleep 5; done
    curl -sfL https://get.k3s.io | K3S_URL='https://${aws_instance.master.private_ip}:6443' K3S_TOKEN='${random_password.k3s_token.result}' sh -
  EOT
  depends_on = [aws_instance.master]
  tags       = { Name = "${var.project}-worker-${count.index + 1}", Role = "k3s-worker" }
}
