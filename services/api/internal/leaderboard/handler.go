package leaderboard

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/prepforall/api/pkg/errors"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, rdb *redis.Client, log *zap.Logger) {
	svc := NewService(rdb, log)
	h := &Handler{service: svc}

	r.Route("/leaderboard", func(r chi.Router) {
		r.Get("/global", h.GlobalRanking)
		r.Get("/contest/{contestId}", h.ContestRanking)
	})
}

func (h *Handler) GlobalRanking(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	ranking, err := h.service.GetGlobalRanking(r.Context(), page, 50)
	if err != nil {
		errors.WriteError(w, errors.ErrInternal)
		return
	}
	errors.WriteJSON(w, http.StatusOK, ranking)
}

func (h *Handler) ContestRanking(w http.ResponseWriter, r *http.Request) {
	contestID := chi.URLParam(r, "contestId")
	ranking, err := h.service.GetContestRanking(r.Context(), contestID)
	if err != nil {
		errors.WriteError(w, errors.ErrInternal)
		return
	}
	errors.WriteJSON(w, http.StatusOK, ranking)
}
