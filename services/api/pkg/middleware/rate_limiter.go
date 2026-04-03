package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimiter returns a Redis-backed sliding window rate limiter middleware.
// limit = max requests allowed within the window duration per IP.
func RateLimiter(rdb *redis.Client, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.RemoteAddr
			key := fmt.Sprintf("ratelimit:%s:%s", ip, r.URL.Path)

			now := time.Now()
			windowStart := now.Add(-window).UnixMilli()

			pipe := rdb.Pipeline()
			pipe.ZRemRangeByScore(r.Context(), key, "0", fmt.Sprintf("%d", windowStart))
			pipe.ZCard(r.Context(), key)
			pipe.ZAdd(r.Context(), key, redis.Z{Score: float64(now.UnixMilli()), Member: now.UnixNano()})
			pipe.Expire(r.Context(), key, window)

			cmds, err := pipe.Exec(r.Context())
			if err != nil && err != context.Canceled {
				next.ServeHTTP(w, r)
				return
			}

			count := cmds[1].(*redis.IntCmd).Val()
			if count >= int64(limit) {
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", window.Seconds()))
				http.Error(w, `{"error":"rate limit exceeded"}`, http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
