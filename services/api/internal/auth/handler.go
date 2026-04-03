package auth

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/prepforall/api/config"
	"github.com/prepforall/api/pkg/errors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, cfg *config.Config, log *zap.Logger) {
	repo := NewRepository(db)
	svc := NewService(repo, rdb, cfg.JWTSecret, cfg.JWTExpiry, log)
	h := &Handler{service: svc}

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.Refresh)
		r.Post("/logout", h.Logout)
	})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, err := h.service.Register(r.Context(), req)
	if err != nil {
		errors.WriteError(w, err)
		return
	}

	errors.WriteJSON(w, http.StatusCreated, resp)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		errors.WriteError(w, err)
		return
	}

	errors.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	// TODO: implement token refresh
	errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	// TODO: blacklist token in Redis
	errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
