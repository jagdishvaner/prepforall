package submissions

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prepforall/api/internal/problems"
	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/middleware"
	authMiddleware "github.com/prepforall/api/pkg/middleware"
	"github.com/prepforall/api/pkg/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, s3 *storage.S3Client, jwtSecret string, log *zap.Logger) {
	repo := NewRepository(db)
	problemRepo := problems.NewRepository(db)
	svc := NewService(repo, problemRepo, rdb, s3, log)
	h := &Handler{service: svc}

	r.Route("/submissions", func(r chi.Router) {
		r.Use(authMiddleware.Authenticate(jwtSecret))
		r.Post("/", h.Submit)
		r.Post("/run", h.Run)
		r.Get("/{id}", h.GetSubmission)
		r.Get("/", h.ListMySubmissions)
	})
}

func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var req SubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}
	if req.ProblemSlug == "" || req.Language == "" || req.Code == "" {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	sub, err := h.service.Submit(r.Context(), userID, req)
	if err != nil {
		errors.WriteError(w, err)
		return
	}

	errors.WriteJSON(w, http.StatusCreated, sub)
}

func (h *Handler) Run(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var req RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}
	if req.ProblemSlug == "" || req.Language == "" || req.Code == "" {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, err := h.service.Run(r.Context(), userID, req)
	if err != nil {
		errors.WriteError(w, err)
		return
	}

	errors.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) GetSubmission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sub, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, sub)
}

func (h *Handler) ListMySubmissions(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	subs, err := h.service.ListByUser(r.Context(), userID)
	if err != nil {
		errors.WriteError(w, errors.ErrInternal)
		return
	}
	errors.WriteJSON(w, http.StatusOK, subs)
}
