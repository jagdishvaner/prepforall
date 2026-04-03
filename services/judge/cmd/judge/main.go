package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/prepforall/judge/internal/worker"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func main() {
	log, _ := zap.NewProduction()
	defer log.Sync()

	rdb := redis.NewClient(&redis.Options{
		Addr: mustEnv("REDIS_ADDR"),
	})

	w := worker.New(rdb, log)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Info("Judge worker shutting down...")
		cancel()
	}()

	log.Info("Judge worker started")
	w.Start(ctx)
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("missing required env: " + key)
	}
	return v
}
