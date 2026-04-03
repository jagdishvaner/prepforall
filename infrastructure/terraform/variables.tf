variable "env" {
  description = "Environment name (production, staging)"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "rds_instance_class" {
  type    = string
  default = "db.t3.medium"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t3.medium"
}

variable "api_instance_type" {
  description = "EC2 instance type for API servers"
  type        = string
  default     = "t3.medium"
}

variable "judge_instance_type" {
  description = "EC2 instance type for judge workers (compute-optimized)"
  type        = string
  default     = "c6i.xlarge"
}
