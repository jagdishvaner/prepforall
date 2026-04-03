package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Env            string
	Port           string
	DatabaseURL    string
	RedisAddr      string
	JWTSecret      string
	JWTExpiry      string
	AWSRegion      string
	S3Bucket       string
	AllowedOrigins []string
}

func Load() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath(".")

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	viper.SetDefault("env", "development")
	viper.SetDefault("port", "8080")
	viper.SetDefault("jwt_expiry", "24h")
	viper.SetDefault("aws_region", "ap-south-1")

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("No config file found, relying on environment variables: %v", err)
	}

	return &Config{
		Env:            viper.GetString("ENV"),
		Port:           viper.GetString("PORT"),
		DatabaseURL:    viper.GetString("DATABASE_URL"),
		RedisAddr:      viper.GetString("REDIS_ADDR"),
		JWTSecret:      viper.GetString("JWT_SECRET"),
		JWTExpiry:      viper.GetString("JWT_EXPIRY"),
		AWSRegion:      viper.GetString("AWS_REGION"),
		S3Bucket:       viper.GetString("S3_BUCKET"),
		AllowedOrigins: viper.GetStringSlice("ALLOWED_ORIGINS"),
	}
}
