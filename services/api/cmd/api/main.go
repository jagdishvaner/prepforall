package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/prepforall/api/config"
	"github.com/prepforall/api/internal/auth"
	"github.com/prepforall/api/internal/contests"
	"github.com/prepforall/api/internal/leaderboard"
	"github.com/prepforall/api/internal/problems"
	"github.com/prepforall/api/internal/realtime"
	"github.com/prepforall/api/internal/submissions"
	"github.com/prepforall/api/internal/users"
	"github.com/prepforall/api/pkg/cache"
	"github.com/prepforall/api/pkg/database"
	"github.com/prepforall/api/pkg/logger"
	"github.com/prepforall/api/pkg/metrics"
	"github.com/prepforall/api/pkg/middleware"
	"github.com/prepforall/api/pkg/storage"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	cfg := config.Load()
	log := logger.New(cfg.Env)
	defer log.Sync()

	db := database.Connect(cfg.DatabaseURL)
	defer db.Close()

	rdb := cache.Connect(cfg.RedisAddr)
	defer rdb.Close()

	s3Client := storage.NewS3Client(cfg.AWSRegion, cfg.S3Bucket)

	wsHub := realtime.NewHub(rdb)
	go wsHub.Run()

	resultConsumer := submissions.NewResultConsumer(db, rdb, wsHub, log)
	go resultConsumer.Start(context.Background())

	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Logger(log))
	r.Use(middleware.Metrics())
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status":"ok"}`)
	})
	r.Handle("/metrics", promhttp.Handler())

	r.Route("/api/v1", func(r chi.Router) {
		auth.RegisterRoutes(r, db, rdb, cfg, log)
		users.RegisterRoutes(r, db, log)
		problems.RegisterRoutes(r, db, rdb, s3Client, log)
		submissions.RegisterRoutes(r, db, rdb, s3Client, cfg.JWTSecret, log)
		contests.RegisterRoutes(r, db, rdb, log)
		leaderboard.RegisterRoutes(r, rdb, log)
	})

	r.Get("/ws", realtime.ServeWS(wsHub))

	metrics.RegisterAll()

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Sugar().Infof("API server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Sugar().Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Sugar().Info("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Sugar().Fatalf("forced shutdown: %v", err)
	}

	log.Sugar().Info("Server exited cleanly")
}
