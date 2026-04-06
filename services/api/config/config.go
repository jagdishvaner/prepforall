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

	// OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	GithubClientID     string
	GithubClientSecret string
	GithubRedirectURL  string

	// Frontend
	FrontendURL string

	// Token expiry
	AccessExpiry  string // e.g. "15m"
	RefreshExpiry string // e.g. "168h" = 7 days
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
	viper.SetDefault("access_expiry", "15m")
	viper.SetDefault("refresh_expiry", "168h")
	viper.SetDefault("frontend_url", "http://localhost:5173")
	viper.SetDefault("google_redirect_url", "http://localhost:8080/api/v1/auth/google/callback")
	viper.SetDefault("github_redirect_url", "http://localhost:8080/api/v1/auth/github/callback")

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

		GoogleClientID:     viper.GetString("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: viper.GetString("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  viper.GetString("GOOGLE_REDIRECT_URL"),
		GithubClientID:     viper.GetString("GITHUB_CLIENT_ID"),
		GithubClientSecret: viper.GetString("GITHUB_CLIENT_SECRET"),
		GithubRedirectURL:  viper.GetString("GITHUB_REDIRECT_URL"),
		FrontendURL:        viper.GetString("FRONTEND_URL"),
		AccessExpiry:       viper.GetString("ACCESS_EXPIRY"),
		RefreshExpiry:      viper.GetString("REFRESH_EXPIRY"),
	}
}
