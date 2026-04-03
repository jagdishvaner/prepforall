package users

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prepforall/api/pkg/errors"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, log *zap.Logger) {
	repo := NewRepository(db)
	svc := NewService(repo, log)
	h := &Handler{service: svc}

	r.Route("/users", func(r chi.Router) {
		r.Get("/{username}", h.GetProfile)
		r.Get("/{username}/stats", h.GetStats)
	})
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	user, err := h.service.GetProfile(r.Context(), username)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, user)
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	stats, err := h.service.GetStats(r.Context(), username)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, stats)
}
