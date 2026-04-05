package auth

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prepforall/api/config"
	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, cfg *config.Config, log *zap.Logger) {
	repo := NewRepository(db)
	svc := NewService(repo, rdb, cfg, log)
	h := &Handler{service: svc}

	r.Route("/auth", func(r chi.Router) {
		// Public routes
		r.Post("/register", h.Register)
		r.Post("/login", h.Login)
		r.Post("/refresh", h.Refresh)
		r.Post("/logout", h.Logout)
		r.Post("/setup", h.Setup)
		r.Post("/forgot-password", h.ForgotPassword)
		r.Post("/reset-password", h.ResetPassword)

		// OAuth routes
		r.Get("/google", h.GoogleLogin)
		r.Get("/google/callback", h.GoogleCallback)
		r.Get("/github", h.GithubLogin)
		r.Get("/github/callback", h.GithubCallback)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))
			r.Get("/me", h.Me)
		})
	})

	// Invite endpoint (requires authenticated admin/org_admin)
	r.Route("/invites", func(r chi.Router) {
		r.Use(middleware.Authenticate(cfg.JWTSecret))
		r.Use(middleware.RequireRole("super_admin", "org_admin"))
		r.Post("/", h.Invite)
	})
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, refreshToken, appErr := h.service.Register(r.Context(), req)
	if appErr != nil {
		errors.WriteError(w, appErr)
		return
	}

	setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
	errors.WriteJSON(w, http.StatusCreated, resp)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, refreshToken, appErr := h.service.Login(r.Context(), req)
	if appErr != nil {
		errors.WriteError(w, appErr)
		return
	}

	setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
	errors.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		errors.WriteError(w, errors.ErrUnauthorized)
		return
	}

	resp, newRefreshToken, appErr := h.service.RefreshTokens(r.Context(), cookie.Value)
	if appErr != nil {
		clearRefreshCookie(w)
		errors.WriteError(w, appErr)
		return
	}

	setRefreshCookie(w, newRefreshToken, h.service.refreshExpiry)
	errors.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, _ := r.Cookie("refresh_token")
	if cookie != nil {
		h.service.BlacklistToken(r.Context(), cookie.Value)
	}
	clearRefreshCookie(w)
	errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Setup(w http.ResponseWriter, r *http.Request) {
	var req SetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, refreshToken, appErr := h.service.Setup(r.Context(), req)
	if appErr != nil {
		errors.WriteError(w, appErr)
		return
	}

	setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
	errors.WriteJSON(w, http.StatusCreated, resp)
}

func (h *Handler) Invite(w http.ResponseWriter, r *http.Request) {
	var req InviteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	invitedBy, _ := r.Context().Value(middleware.UserIDKey).(string)

	resp, appErr := h.service.Invite(r.Context(), req, invitedBy)
	if appErr != nil {
		errors.WriteError(w, appErr)
		return
	}

	errors.WriteJSON(w, http.StatusCreated, resp)
}

func (h *Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	// Always return success to prevent email enumeration
	if appErr := h.service.ForgotPassword(r.Context(), req); appErr != nil {
		// Log but don't expose
		h.service.log.Error("forgot password error", zap.String("error", appErr.Message))
	}

	errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	if appErr := h.service.ResetPassword(r.Context(), req); appErr != nil {
		errors.WriteError(w, appErr)
		return
	}

	errors.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		errors.WriteError(w, errors.ErrUnauthorized)
		return
	}

	resp, appErr := h.service.GetMe(r.Context(), userID)
	if appErr != nil {
		errors.WriteError(w, appErr)
		return
	}

	errors.WriteJSON(w, http.StatusOK, resp)
}

func setRefreshCookie(w http.ResponseWriter, token string, expiry time.Duration) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/api/v1/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   int(expiry.Seconds()),
	})
}

func clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/v1/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   -1,
	})
}
