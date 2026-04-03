package contests

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prepforall/api/pkg/errors"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, log *zap.Logger) {
	repo := NewRepository(db)
	svc := NewService(repo, rdb, log)
	h := &Handler{service: svc}

	r.Route("/contests", func(r chi.Router) {
		r.Get("/", h.List)
		r.Get("/{id}", h.GetByID)
		r.Get("/{id}/problems", h.GetProblems)
		r.Post("/{id}/register", h.Register)
	})
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	contests, err := h.service.List(r.Context())
	if err != nil {
		errors.WriteError(w, errors.ErrInternal)
		return
	}
	errors.WriteJSON(w, http.StatusOK, contests)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	contest, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, contest)
}

func (h *Handler) GetProblems(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	problems, err := h.service.GetProblems(r.Context(), id)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, problems)
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "registered"})
}
