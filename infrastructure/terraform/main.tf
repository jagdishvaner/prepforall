terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "prepforall-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── VPC ────────────────────────────────────────────────────────────────────
module "vpc" {
  source = "./modules/vpc"
  name   = "prepforall-${var.env}"
  cidr   = var.vpc_cidr
}

# ─── RDS PostgreSQL ─────────────────────────────────────────────────────────
module "rds" {
  source             = "./modules/rds"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_name            = "prepforall"
  db_username        = var.db_username
  db_password        = var.db_password
  instance_class     = var.rds_instance_class
  env                = var.env
}

# ─── ElastiCache Redis ───────────────────────────────────────────────────────
module "elasticache" {
  source             = "./modules/elasticache"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_type          = var.redis_node_type
  env                = var.env
}

# ─── S3 Buckets ─────────────────────────────────────────────────────────────
module "s3" {
  source      = "./modules/s3"
  bucket_name = "prepforall-${var.env}"
  env         = var.env
}

# ─── EC2 Auto Scaling: API ──────────────────────────────────────────────────
module "api_ec2" {
  source             = "./modules/ec2"
  name               = "prepforall-api"
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_type      = var.api_instance_type
  min_size           = 2
  max_size           = 10
  desired_capacity   = 2
  env                = var.env
  role               = "api"
}

# ─── EC2 Auto Scaling: Judge Workers ────────────────────────────────────────
module "judge_ec2" {
  source             = "./modules/ec2"
  name               = "prepforall-judge"
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_type      = var.judge_instance_type
  min_size           = 1
  max_size           = 20
  desired_capacity   = 2
  env                = var.env
  role               = "judge"
  # Scale based on Redis queue depth via custom CloudWatch metric
  scaling_metric = "SubmissionQueueDepth"
}
