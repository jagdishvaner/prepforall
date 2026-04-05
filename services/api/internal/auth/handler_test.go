package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"
)

const testJWTSecret = "test-secret-key-for-unit-tests-min-32"

func TestSetRefreshCookie(t *testing.T) {
	w := httptest.NewRecorder()
	expiry := 7 * 24 * time.Hour
	setRefreshCookie(w, "test-refresh-token", expiry)

	resp := w.Result()
	cookies := resp.Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected refresh_token cookie to be set")
	}

	cookie := cookies[0]
	if cookie.Name != "refresh_token" {
		t.Errorf("expected cookie name 'refresh_token', got '%s'", cookie.Name)
	}
	if cookie.Value != "test-refresh-token" {
		t.Errorf("expected cookie value 'test-refresh-token', got '%s'", cookie.Value)
	}
	if !cookie.HttpOnly {
		t.Error("expected cookie to be HttpOnly")
	}
	if !cookie.Secure {
		t.Error("expected cookie to be Secure")
	}
	if cookie.SameSite != http.SameSiteStrictMode {
		t.Error("expected cookie SameSite to be Strict")
	}
	if cookie.Path != "/api/v1/auth" {
		t.Errorf("expected cookie path '/api/v1/auth', got '%s'", cookie.Path)
	}
	expectedMaxAge := int(expiry.Seconds())
	if cookie.MaxAge != expectedMaxAge {
		t.Errorf("expected MaxAge %d, got %d", expectedMaxAge, cookie.MaxAge)
	}
}

func TestClearRefreshCookie(t *testing.T) {
	w := httptest.NewRecorder()
	clearRefreshCookie(w)

	resp := w.Result()
	cookies := resp.Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected refresh_token cookie to be cleared")
	}

	cookie := cookies[0]
	if cookie.Name != "refresh_token" {
		t.Errorf("expected cookie name 'refresh_token', got '%s'", cookie.Name)
	}
	if cookie.Value != "" {
		t.Errorf("expected empty cookie value, got '%s'", cookie.Value)
	}
	if cookie.MaxAge != -1 {
		t.Errorf("expected MaxAge -1 (delete), got %d", cookie.MaxAge)
	}
}

func TestLoginHandler_BadRequest(t *testing.T) {
	// Sending invalid JSON should return 400
	h := &Handler{service: nil}

	body := bytes.NewBufferString("{invalid json}")
	req := httptest.NewRequest(http.MethodPost, "/auth/login", body)
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp map[string]string
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["error"] != "bad request" {
		t.Errorf("expected error 'bad request', got '%s'", resp["error"])
	}
}

func TestRegisterHandler_BadRequest(t *testing.T) {
	h := &Handler{service: nil}

	body := bytes.NewBufferString("not json")
	req := httptest.NewRequest(http.MethodPost, "/auth/register", body)
	w := httptest.NewRecorder()

	h.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestSetupHandler_BadRequest(t *testing.T) {
	h := &Handler{service: nil}

	body := bytes.NewBufferString("bad")
	req := httptest.NewRequest(http.MethodPost, "/auth/setup", body)
	w := httptest.NewRecorder()

	h.Setup(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestForgotPasswordHandler_BadRequest(t *testing.T) {
	h := &Handler{service: nil}

	body := bytes.NewBufferString("bad")
	req := httptest.NewRequest(http.MethodPost, "/auth/forgot-password", body)
	w := httptest.NewRecorder()

	h.ForgotPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestResetPasswordHandler_BadRequest(t *testing.T) {
	h := &Handler{service: nil}

	body := bytes.NewBufferString("bad")
	req := httptest.NewRequest(http.MethodPost, "/auth/reset-password", body)
	w := httptest.NewRecorder()

	h.ResetPassword(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestInviteHandler_BadRequest(t *testing.T) {
	h := &Handler{service: nil}

	body := bytes.NewBufferString("bad")
	req := httptest.NewRequest(http.MethodPost, "/invites/", body)
	w := httptest.NewRecorder()

	h.Invite(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestRefreshHandler_NoCookie(t *testing.T) {
	h := &Handler{service: nil}

	req := httptest.NewRequest(http.MethodPost, "/auth/refresh", nil)
	w := httptest.NewRecorder()

	h.Refresh(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status %d, got %d", http.StatusUnauthorized, w.Code)
	}
}

func TestLogoutHandler_NoCookie(t *testing.T) {
	h := &Handler{service: &Service{}}

	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	w := httptest.NewRecorder()

	h.Logout(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp map[string]string
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["status"] != "ok" {
		t.Errorf("expected status 'ok', got '%s'", resp["status"])
	}

	// Should clear the refresh cookie
	cookies := w.Result().Cookies()
	found := false
	for _, c := range cookies {
		if c.Name == "refresh_token" && c.MaxAge == -1 {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected refresh_token cookie to be cleared on logout")
	}
}

func TestMeHandler_NoUserID(t *testing.T) {
	h := &Handler{service: &Service{}}

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	w := httptest.NewRecorder()

	h.Me(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status %d, got %d", http.StatusUnauthorized, w.Code)
	}
}

func TestGenerateSecureToken(t *testing.T) {
	token1, err := generateSecureToken(32)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(token1) != 64 { // 32 bytes = 64 hex chars
		t.Errorf("expected token length 64, got %d", len(token1))
	}

	token2, err := generateSecureToken(32)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if token1 == token2 {
		t.Error("expected tokens to be unique")
	}
}

func TestBuildOAuthURL(t *testing.T) {
	cfg := &OAuthProviderConfig{
		ClientID:    "test-client-id",
		RedirectURL: "http://localhost:8080/callback",
		AuthURL:     "https://accounts.google.com/o/oauth2/v2/auth",
		Scopes:      []string{"openid", "email", "profile"},
	}

	url := buildOAuthURL(cfg, "test-state")

	// Check that URL contains expected params
	if url == "" {
		t.Fatal("expected non-empty URL")
	}

	// Parse the URL to verify params
	tests := []struct {
		param string
		value string
	}{
		{"client_id", "test-client-id"},
		{"redirect_uri", "http://localhost:8080/callback"},
		{"response_type", "code"},
		{"state", "test-state"},
		{"scope", "openid email profile"},
	}

	for _, tt := range tests {
		if !containsParam(url, tt.param, tt.value) {
			t.Errorf("URL missing param %s=%s in URL: %s", tt.param, tt.value, url)
		}
	}
}

// containsParam is a simple check for query param presence in a URL string.
func containsParam(rawURL, key, value string) bool {
	// This is a simplified check - in production you'd parse the URL
	expected := key + "=" + url.QueryEscape(value)
	return bytes.Contains([]byte(rawURL), []byte(expected)) ||
		bytes.Contains([]byte(rawURL), []byte(key+"="+value))
}
