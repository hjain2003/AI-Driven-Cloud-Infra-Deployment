provider "aws" {
  access_key = "AKIAUMYCINQ23YCFLAMB"
  secret_key = "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"
  region     = "ap-south-1" 	
}

resource "aws_instance" "web_server" {
  ami                    = "ami-0ddfba243cbee3768"
  instance_type          = "t2.micro"              
  key_name               = "terraform"           
  tags = {
    Name = "EC2-Instance"
  }
}

