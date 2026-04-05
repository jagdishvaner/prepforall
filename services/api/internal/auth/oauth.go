package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

// GoogleLogin redirects to Google's OAuth consent screen.
func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if h.service.google == nil {
		http.Error(w, `{"error":"Google OAuth not configured"}`, http.StatusNotImplemented)
		return
	}

	state, _ := generateSecureToken(16)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/api/v1/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   300,
	})

	authURL := buildOAuthURL(h.service.google, state)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// GoogleCallback handles the OAuth callback from Google.
func (h *Handler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		frontendErr := h.service.frontendURL + "/auth/oauth-callback?error=missing_code"
		http.Redirect(w, r, frontendErr, http.StatusTemporaryRedirect)
		return
	}

	result, refreshToken, appErr := h.service.HandleOAuthCallback(r.Context(), "google", code)
	if appErr != nil {
		frontendErr := h.service.frontendURL + "/auth/oauth-callback?error=" + url.QueryEscape(appErr.Message)
		http.Redirect(w, r, frontendErr, http.StatusTemporaryRedirect)
		return
	}

	setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
	frontendCallback := h.service.frontendURL + "/auth/oauth-callback?access_token=" + result.AccessToken
	http.Redirect(w, r, frontendCallback, http.StatusTemporaryRedirect)
}

// GithubLogin redirects to GitHub's OAuth consent screen.
func (h *Handler) GithubLogin(w http.ResponseWriter, r *http.Request) {
	if h.service.github == nil {
		http.Error(w, `{"error":"GitHub OAuth not configured"}`, http.StatusNotImplemented)
		return
	}

	state, _ := generateSecureToken(16)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/api/v1/auth",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   300,
	})

	authURL := buildOAuthURL(h.service.github, state)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// GithubCallback handles the OAuth callback from GitHub.
func (h *Handler) GithubCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		frontendErr := h.service.frontendURL + "/auth/oauth-callback?error=missing_code"
		http.Redirect(w, r, frontendErr, http.StatusTemporaryRedirect)
		return
	}

	result, refreshToken, appErr := h.service.HandleOAuthCallback(r.Context(), "github", code)
	if appErr != nil {
		frontendErr := h.service.frontendURL + "/auth/oauth-callback?error=" + url.QueryEscape(appErr.Message)
		http.Redirect(w, r, frontendErr, http.StatusTemporaryRedirect)
		return
	}

	setRefreshCookie(w, refreshToken, h.service.refreshExpiry)
	frontendCallback := h.service.frontendURL + "/auth/oauth-callback?access_token=" + result.AccessToken
	http.Redirect(w, r, frontendCallback, http.StatusTemporaryRedirect)
}

// buildOAuthURL constructs the OAuth authorization URL with the given provider config and state.
func buildOAuthURL(cfg *OAuthProviderConfig, state string) string {
	params := url.Values{
		"client_id":     {cfg.ClientID},
		"redirect_uri":  {cfg.RedirectURL},
		"response_type": {"code"},
		"state":         {state},
		"scope":         {strings.Join(cfg.Scopes, " ")},
	}
	return fmt.Sprintf("%s?%s", cfg.AuthURL, params.Encode())
}

// decodeJSON is a helper to decode JSON from a reader.
func decodeJSON(r io.Reader, v interface{}) error {
	return json.NewDecoder(r).Decode(v)
}
