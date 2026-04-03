package problems

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, s3 *storage.S3Client, log *zap.Logger) {
	repo := NewRepository(db)
	svc := NewService(repo, rdb, s3, log)
	h := &Handler{service: svc}

	r.Route("/problems", func(r chi.Router) {
		r.Get("/", h.List)
		r.Get("/{slug}", h.GetBySlug)
		r.Get("/{slug}/testcases/sample", h.GetSampleTestCases)
	})
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	filter := ListFilter{
		Difficulty: r.URL.Query().Get("difficulty"),
		Search:     r.URL.Query().Get("q"),
		Page:       page,
		Limit:      20,
	}

	problems, err := h.service.List(r.Context(), filter)
	if err != nil {
		errors.WriteError(w, errors.ErrInternal)
		return
	}
	errors.WriteJSON(w, http.StatusOK, problems)
}

func (h *Handler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	problem, err := h.service.GetBySlug(r.Context(), slug)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, problem)
}

func (h *Handler) GetSampleTestCases(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	cases, err := h.service.GetSampleTestCases(r.Context(), slug)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, cases)
}
