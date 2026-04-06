package auth

import (
	"database/sql"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/prepforall/api/config"
	"go.uber.org/zap"
)

func newTestService(t *testing.T) *Service {
	t.Helper()
	log, _ := zap.NewDevelopment()
	cfg := &config.Config{
		JWTSecret:     testJWTSecret,
		AccessExpiry:  "15m",
		RefreshExpiry: "168h",
		FrontendURL:   "http://localhost:5173",
	}
	// Create service without repo/redis for unit tests that don't need them
	return NewService(nil, nil, cfg, log)
}

func TestNewService_Defaults(t *testing.T) {
	log, _ := zap.NewDevelopment()
	cfg := &config.Config{
		JWTSecret:     testJWTSecret,
		AccessExpiry:  "",
		RefreshExpiry: "",
	}
	svc := NewService(nil, nil, cfg, log)

	if svc.accessExpiry != 15*time.Minute {
		t.Errorf("expected default access expiry 15m, got %v", svc.accessExpiry)
	}
	if svc.refreshExpiry != 7*24*time.Hour {
		t.Errorf("expected default refresh expiry 168h, got %v", svc.refreshExpiry)
	}
}

func TestNewService_WithOAuth(t *testing.T) {
	log, _ := zap.NewDevelopment()
	cfg := &config.Config{
		JWTSecret:          testJWTSecret,
		AccessExpiry:       "15m",
		RefreshExpiry:      "168h",
		GoogleClientID:     "google-id",
		GoogleClientSecret: "google-secret",
		GoogleRedirectURL:  "http://localhost:8080/callback",
		GithubClientID:     "github-id",
		GithubClientSecret: "github-secret",
		GithubRedirectURL:  "http://localhost:8080/gh-callback",
	}
	svc := NewService(nil, nil, cfg, log)

	if svc.google == nil {
		t.Fatal("expected Google OAuth config to be set")
	}
	if svc.google.ClientID != "google-id" {
		t.Errorf("expected Google client ID 'google-id', got '%s'", svc.google.ClientID)
	}
	if svc.github == nil {
		t.Fatal("expected GitHub OAuth config to be set")
	}
	if svc.github.ClientID != "github-id" {
		t.Errorf("expected GitHub client ID 'github-id', got '%s'", svc.github.ClientID)
	}
}

func TestNewService_WithoutOAuth(t *testing.T) {
	log, _ := zap.NewDevelopment()
	cfg := &config.Config{
		JWTSecret:     testJWTSecret,
		AccessExpiry:  "15m",
		RefreshExpiry: "168h",
	}
	svc := NewService(nil, nil, cfg, log)

	if svc.google != nil {
		t.Error("expected Google OAuth config to be nil when not configured")
	}
	if svc.github != nil {
		t.Error("expected GitHub OAuth config to be nil when not configured")
	}
}

func TestGenerateTokenPair(t *testing.T) {
	svc := newTestService(t)

	user := &User{
		ID:        "user-123",
		Username:  "testuser",
		Email:     "test@example.com",
		Role:      "student",
		OrgID:     sql.NullString{String: "org-456", Valid: true},
		AvatarURL: sql.NullString{String: "https://example.com/avatar.png", Valid: true},
	}

	resp, refreshToken, appErr := svc.generateTokenPair(user)
	if appErr != nil {
		t.Fatalf("unexpected error: %v", appErr)
	}

	// Verify access token
	if resp.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
	if resp.ExpiresIn != int((15 * time.Minute).Seconds()) {
		t.Errorf("expected ExpiresIn %d, got %d", int((15*time.Minute).Seconds()), resp.ExpiresIn)
	}

	// Parse access token and verify claims
	accessToken, err := jwt.Parse(resp.AccessToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(testJWTSecret), nil
	})
	if err != nil {
		t.Fatalf("failed to parse access token: %v", err)
	}

	claims, ok := accessToken.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("expected MapClaims")
	}

	if claims["sub"] != "user-123" {
		t.Errorf("expected sub 'user-123', got '%v'", claims["sub"])
	}
	if claims["username"] != "testuser" {
		t.Errorf("expected username 'testuser', got '%v'", claims["username"])
	}
	if claims["email"] != "test@example.com" {
		t.Errorf("expected email 'test@example.com', got '%v'", claims["email"])
	}
	if claims["role"] != "student" {
		t.Errorf("expected role 'student', got '%v'", claims["role"])
	}
	if claims["org_id"] != "org-456" {
		t.Errorf("expected org_id 'org-456', got '%v'", claims["org_id"])
	}
	if claims["avatar_url"] != "https://example.com/avatar.png" {
		t.Errorf("expected avatar_url, got '%v'", claims["avatar_url"])
	}

	// Verify refresh token
	if refreshToken == "" {
		t.Fatal("expected non-empty refresh token")
	}

	refreshParsed, err := jwt.Parse(refreshToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(testJWTSecret), nil
	})
	if err != nil {
		t.Fatalf("failed to parse refresh token: %v", err)
	}

	refreshClaims, ok := refreshParsed.Claims.(jwt.MapClaims)
	if !ok {
		t.Fatal("expected MapClaims for refresh token")
	}

	if refreshClaims["sub"] != "user-123" {
		t.Errorf("expected refresh sub 'user-123', got '%v'", refreshClaims["sub"])
	}
	if refreshClaims["type"] != "refresh" {
		t.Errorf("expected refresh type 'refresh', got '%v'", refreshClaims["type"])
	}
}

func TestGenerateTokenPair_NullFields(t *testing.T) {
	svc := newTestService(t)

	user := &User{
		ID:        "user-789",
		Username:  "nulluser",
		Email:     "null@example.com",
		Role:      "user",
		OrgID:     sql.NullString{Valid: false},
		AvatarURL: sql.NullString{Valid: false},
	}

	resp, refreshToken, appErr := svc.generateTokenPair(user)
	if appErr != nil {
		t.Fatalf("unexpected error: %v", appErr)
	}

	if resp.AccessToken == "" {
		t.Fatal("expected non-empty access token")
	}
	if refreshToken == "" {
		t.Fatal("expected non-empty refresh token")
	}

	// Parse and verify null fields produce empty strings in claims
	accessToken, _ := jwt.Parse(resp.AccessToken, func(t *jwt.Token) (interface{}, error) {
		return []byte(testJWTSecret), nil
	})
	claims := accessToken.Claims.(jwt.MapClaims)

	if claims["org_id"] != "" {
		t.Errorf("expected empty org_id, got '%v'", claims["org_id"])
	}
	if claims["avatar_url"] != "" {
		t.Errorf("expected empty avatar_url, got '%v'", claims["avatar_url"])
	}
}

func TestExchangeOAuthCode_NilProvider(t *testing.T) {
	svc := newTestService(t)

	_, appErr := svc.getGoogleUserInfo(nil, "code")
	if appErr == nil {
		t.Fatal("expected error for nil Google config")
	}
	if appErr.Code != 500 {
		t.Errorf("expected status 500, got %d", appErr.Code)
	}

	_, appErr = svc.getGithubUserInfo(nil, "code")
	if appErr == nil {
		t.Fatal("expected error for nil GitHub config")
	}
	if appErr.Code != 500 {
		t.Errorf("expected status 500, got %d", appErr.Code)
	}
}

func TestHandleOAuthCallback_UnsupportedProvider(t *testing.T) {
	svc := newTestService(t)

	_, _, appErr := svc.HandleOAuthCallback(nil, "unknown", "code")
	if appErr == nil {
		t.Fatal("expected error for unsupported provider")
	}
	if appErr.Code != 400 {
		t.Errorf("expected status 400, got %d", appErr.Code)
	}
}
