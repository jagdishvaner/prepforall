package cache

import (
	"context"
	"log"

	"github.com/redis/go-redis/v9"
)

func Connect(addr string) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:         addr,
		PoolSize:     20,
		MinIdleConns: 5,
	})

	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("failed to connect to Redis: %v", err)
	}

	log.Println("Connected to Redis")
	return rdb
}
