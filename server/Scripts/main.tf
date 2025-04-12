provider "aws" {
  access_key = "AKIAUMYCINQ2TJ2N4FOF"
  secret_key = "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"
  region     = "us-west-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-west-1a"

  tags = {
    Name = "public-subnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-1b"

  tags = {
    Name = "private-subnet"
  }
}

resource "aws_route_table" "public_route_table" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "public-route-table"
  }
}


resource "aws_route_table_association" "public_subnet_association" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_route_table.id
}


resource "aws_route_table" "private_route_table" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "private-route-table"
  }
}

resource "aws_route_table_association" "private_subnet_association" {
 subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private_route_table.id
}

resource "aws_security_group" "allow_ssh_http_https" {
  name        = "allow_ssh_http_https"
  description = "Allow SSH, HTTP, and HTTPS inbound traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "SSH"
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  ingress {
    description      = "HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  ingress {
    description      = "HTTPS"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_ssh_http_https"
  }
}

resource "aws_instance" "example" {
  ami                    = "ami-020fbc00dbecba358"
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.allow_ssh_http_https.id]
  subnet_id = aws_subnet.public.id

 user_data = <<EOF
 #!/bin/bash
 yum update -y
 yum install httpd -y
 systemctl start httpd
 systemctl enable httpd
 echo "<html><body><h1>Hello from Terraform!</h1></body></html>" > /var/www/html/index.html

EOF

  tags = {
    Name = "example"
  }
}