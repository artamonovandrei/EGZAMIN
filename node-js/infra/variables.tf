variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "project" {
  type    = string
  default = "dino-dash"
}
variable "key_name" {
  type        = string
  description = "Existing EC2 Key Pair name used by GitHub Actions for deployment."
}
variable "ssh_cidr" {
  type        = string
  description = "Trusted CIDR permitted to SSH to the K3s control-plane."
}
variable "instance_type" {
  type        = string
  default     = "t4g.micro"
  description = "Lowest-cost ARM instance suitable for this demonstration cluster."
}
