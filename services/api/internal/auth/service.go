package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/prepforall/api/config"
	"github.com/prepforall/api/pkg/errors"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// OAuthProviderConfig holds the OAuth configuration for a single provider.
type OAuthProviderConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	AuthURL      string
	TokenURL     string
	Scopes       []string
	UserInfoURL  string
}

type Service struct {
	repo          *Repository
	rdb           *redis.Client
	httpClient    *http.Client
	jwtSecret     string
	accessExpiry  time.Duration
	refreshExpiry time.Duration
	frontendURL   string
	google        *OAuthProviderConfig
	github        *OAuthProviderConfig
	log           *zap.Logger
}

func NewService(repo *Repository, rdb *redis.Client, cfg *config.Config, log *zap.Logger) *Service {
	accessExpiry, _ := time.ParseDuration(cfg.AccessExpiry)
	if accessExpiry == 0 {
		accessExpiry = 15 * time.Minute
	}
	refreshExpiry, _ := time.ParseDuration(cfg.RefreshExpiry)
	if refreshExpiry == 0 {
		refreshExpiry = 7 * 24 * time.Hour
	}

	var googleCfg *OAuthProviderConfig
	if cfg.GoogleClientID != "" {
		googleCfg = &OAuthProviderConfig{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
			AuthURL:      "https://accounts.google.com/o/oauth2/v2/auth",
			TokenURL:     "https://oauth2.googleapis.com/token",
			Scopes:       []string{"openid", "email", "profile"},
			UserInfoURL:  "https://www.googleapis.com/oauth2/v2/userinfo",
		}
	}

	var githubCfg *OAuthProviderConfig
	if cfg.GithubClientID != "" {
		githubCfg = &OAuthProviderConfig{
			ClientID:     cfg.GithubClientID,
			ClientSecret: cfg.GithubClientSecret,
			RedirectURL:  cfg.GithubRedirectURL,
			AuthURL:      "https://github.com/login/oauth/authorize",
			TokenURL:     "https://github.com/login/oauth/access_token",
			Scopes:       []string{"user:email", "read:user"},
			UserInfoURL:  "https://api.github.com/user",
		}
	}

	return &Service{
		repo:          repo,
		rdb:           rdb,
		httpClient:    &http.Client{Timeout: 10 * time.Second},
		jwtSecret:     cfg.JWTSecret,
		accessExpiry:  accessExpiry,
		refreshExpiry: refreshExpiry,
		frontendURL:   cfg.FrontendURL,
		google:        googleCfg,
		github:        githubCfg,
		log:           log,
	}
}

// Register creates a new user with email/password and returns tokens.
func (s *Service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, string, *errors.AppError) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", errors.ErrInternal
	}

	user, err := s.repo.CreateUser(ctx, req.Username, req.Email, string(hash))
	if err != nil {
		return nil, "", errors.ErrConflict
	}

	return s.generateTokenPair(user)
}

// Login authenticates a user with email/password and returns tokens.
func (s *Service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, string, *errors.AppError) {
	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		return nil, "", errors.ErrUnauthorized
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, "", errors.ErrUnauthorized
	}

	return s.generateTokenPair(user)
}

// Setup redeems an invite token and creates a new user account.
func (s *Service) Setup(ctx context.Context, req SetupRequest) (*AuthResponse, string, *errors.AppError) {
	invite, err := s.repo.FindInviteByToken(ctx, req.Token)
	if err != nil {
		return nil, "", &errors.AppError{Code: 400, Message: "invalid or expired invite"}
	}
	if invite.AcceptedAt != nil {
		return nil, "", &errors.AppError{Code: 400, Message: "invite already used"}
	}
	if time.Now().After(invite.ExpiresAt) {
		return nil, "", &errors.AppError{Code: 400, Message: "invite expired"}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", errors.ErrInternal
	}

	user, err := s.repo.CreateUserFromInvite(ctx, req.Username, invite.Email, string(hash), invite.Role, invite.OrgID)
	if err != nil {
		return nil, "", errors.ErrConflict
	}

	if err := s.repo.AcceptInvite(ctx, invite.ID); err != nil {
		s.log.Error("failed to mark invite as accepted", zap.Error(err))
	}

	return s.generateTokenPair(user)
}

// Invite generates an invite token for a new user.
func (s *Service) Invite(ctx context.Context, req InviteRequest, invitedBy string) (*InviteResponse, *errors.AppError) {
	token, err := generateSecureToken(32)
	if err != nil {
		return nil, errors.ErrInternal
	}

	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	invite := &UserInvite{
		Email:     req.Email,
		OrgID:     req.OrgID,
		BatchID:   req.BatchID,
		Role:      req.Role,
		Token:     token,
		InvitedBy: invitedBy,
		ExpiresAt: expiresAt,
	}

	if err := s.repo.CreateInvite(ctx, invite); err != nil {
		s.log.Error("failed to create invite", zap.Error(err))
		return nil, errors.ErrInternal
	}

	inviteURL := fmt.Sprintf("%s/auth/setup?token=%s", s.frontendURL, token)
	s.log.Info("invite created", zap.String("email", req.Email), zap.String("url", inviteURL))

	return &InviteResponse{
		InviteURL: inviteURL,
		Token:     token,
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}, nil
}

// ForgotPassword generates a password reset token and logs the reset URL.
func (s *Service) ForgotPassword(ctx context.Context, req ForgotPasswordRequest) *errors.AppError {
	user, err := s.repo.FindByEmail(ctx, req.Email)
	if err != nil {
		// Return success even if user not found to prevent email enumeration
		return nil
	}

	token, err := generateSecureToken(32)
	if err != nil {
		return errors.ErrInternal
	}

	expiresAt := time.Now().Add(1 * time.Hour)
	if err := s.repo.StoreResetToken(ctx, user.ID, token, expiresAt); err != nil {
		s.log.Error("failed to store reset token", zap.Error(err))
		return errors.ErrInternal
	}

	resetURL := fmt.Sprintf("%s/auth/reset-password?token=%s", s.frontendURL, token)
	s.log.Info("password reset requested", zap.String("email", req.Email), zap.String("url", resetURL))

	return nil
}

// ResetPassword validates a reset token and updates the user's password.
func (s *Service) ResetPassword(ctx context.Context, req ResetPasswordRequest) *errors.AppError {
	userID, err := s.repo.FindResetToken(ctx, req.Token)
	if err != nil {
		return &errors.AppError{Code: 400, Message: "invalid or expired reset token"}
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.ErrInternal
	}

	if err := s.repo.UpdatePassword(ctx, userID, string(hash)); err != nil {
		s.log.Error("failed to update password", zap.Error(err))
		return errors.ErrInternal
	}

	if err := s.repo.InvalidateResetToken(ctx, req.Token); err != nil {
		s.log.Error("failed to invalidate reset token", zap.Error(err))
	}

	return nil
}

// RefreshTokens validates a refresh token and issues a new token pair.
func (s *Service) RefreshTokens(ctx context.Context, refreshTokenStr string) (*AuthResponse, string, *errors.AppError) {
	// Check if token is blacklisted
	blacklisted, _ := s.rdb.Get(ctx, "blacklist:"+refreshTokenStr).Result()
	if blacklisted != "" {
		return nil, "", errors.ErrUnauthorized
	}

	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, "", errors.ErrUnauthorized
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, "", errors.ErrUnauthorized
	}

	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return nil, "", errors.ErrUnauthorized
	}

	userID, _ := claims["sub"].(string)
	if userID == "" {
		return nil, "", errors.ErrUnauthorized
	}

	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, "", errors.ErrUnauthorized
	}

	// Blacklist the old refresh token (rotate)
	s.BlacklistToken(ctx, refreshTokenStr)

	return s.generateTokenPair(user)
}

// BlacklistToken adds a token to the Redis blacklist.
func (s *Service) BlacklistToken(ctx context.Context, tokenStr string) {
	if err := s.rdb.Set(ctx, "blacklist:"+tokenStr, "1", s.refreshExpiry).Err(); err != nil {
		s.log.Error("failed to blacklist token", zap.Error(err))
	}
}

// GetMe returns the current user's profile from claims.
func (s *Service) GetMe(ctx context.Context, userID string) (*MeResponse, *errors.AppError) {
	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.ErrNotFound
	}

	return &MeResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      user.Role,
		OrgID:     user.OrgID.String,
		AvatarURL: user.AvatarURL.String,
	}, nil
}

// HandleOAuthCallback exchanges an OAuth code for user info, finds or creates the user, and returns tokens.
func (s *Service) HandleOAuthCallback(ctx context.Context, provider, code string) (*AuthResponse, string, *errors.AppError) {
	var userInfo *OAuthUserInfo
	var appErr *errors.AppError

	switch provider {
	case "google":
		userInfo, appErr = s.getGoogleUserInfo(ctx, code)
	case "github":
		userInfo, appErr = s.getGithubUserInfo(ctx, code)
	default:
		return nil, "", &errors.AppError{Code: 400, Message: "unsupported OAuth provider"}
	}

	if appErr != nil {
		return nil, "", appErr
	}

	// Check if OAuth account already linked
	oauthAccount, err := s.repo.FindOAuthAccount(ctx, provider, userInfo.ID)
	if err == nil {
		// Existing OAuth account - find user and issue tokens
		user, err := s.repo.FindByID(ctx, oauthAccount.UserID)
		if err != nil {
			return nil, "", errors.ErrInternal
		}
		return s.generateTokenPair(user)
	}

	// Check if user with this email exists
	user, err := s.repo.FindByEmail(ctx, userInfo.Email)
	if err == nil {
		// Link OAuth account to existing user
		if linkErr := s.repo.CreateOAuthAccount(ctx, user.ID, provider, userInfo.ID, userInfo.Email); linkErr != nil {
			s.log.Error("failed to link OAuth account", zap.Error(linkErr))
		}
		return s.generateTokenPair(user)
	}

	// Create new user from OAuth
	user, err = s.repo.CreateUserFromOAuth(ctx, userInfo.Name, userInfo.Email, userInfo.AvatarURL)
	if err != nil {
		return nil, "", errors.ErrConflict
	}

	if linkErr := s.repo.CreateOAuthAccount(ctx, user.ID, provider, userInfo.ID, userInfo.Email); linkErr != nil {
		s.log.Error("failed to create OAuth account", zap.Error(linkErr))
	}

	return s.generateTokenPair(user)
}

// generateTokenPair creates both an access token and a refresh token.
func (s *Service) generateTokenPair(user *User) (*AuthResponse, string, *errors.AppError) {
	now := time.Now()

	orgID := ""
	if user.OrgID.Valid {
		orgID = user.OrgID.String
	}
	avatarURL := ""
	if user.AvatarURL.Valid {
		avatarURL = user.AvatarURL.String
	}

	// Access token
	accessClaims := jwt.MapClaims{
		"sub":        user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"role":       user.Role,
		"org_id":     orgID,
		"avatar_url": avatarURL,
		"exp":        now.Add(s.accessExpiry).Unix(),
		"iat":        now.Unix(),
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessSigned, err := accessToken.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, "", errors.ErrInternal
	}

	// Refresh token
	refreshClaims := jwt.MapClaims{
		"sub":  user.ID,
		"type": "refresh",
		"exp":  now.Add(s.refreshExpiry).Unix(),
		"iat":  now.Unix(),
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshSigned, err := refreshToken.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, "", errors.ErrInternal
	}

	return &AuthResponse{
		AccessToken: accessSigned,
		ExpiresIn:   int(s.accessExpiry.Seconds()),
	}, refreshSigned, nil
}

// exchangeOAuthCode exchanges an authorization code for an access token using standard OAuth2 POST.
func (s *Service) exchangeOAuthCode(provider *OAuthProviderConfig, code string) (string, *errors.AppError) {
	data := url.Values{
		"code":          {code},
		"client_id":     {provider.ClientID},
		"client_secret": {provider.ClientSecret},
		"redirect_uri":  {provider.RedirectURL},
		"grant_type":    {"authorization_code"},
	}

	req, err := http.NewRequest("POST", provider.TokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return "", errors.ErrInternal
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.log.Error("token exchange failed", zap.Error(err))
		return "", &errors.AppError{Code: 400, Message: "failed to exchange OAuth code"}
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Error       string `json:"error"`
	}
	if err := decodeJSON(resp.Body, &tokenResp); err != nil {
		s.log.Error("failed to decode token response", zap.Error(err))
		return "", errors.ErrInternal
	}

	if tokenResp.Error != "" || tokenResp.AccessToken == "" {
		s.log.Error("OAuth token exchange error", zap.String("error", tokenResp.Error))
		return "", &errors.AppError{Code: 400, Message: "failed to exchange OAuth code"}
	}

	return tokenResp.AccessToken, nil
}

func (s *Service) getGoogleUserInfo(ctx context.Context, code string) (*OAuthUserInfo, *errors.AppError) {
	if s.google == nil {
		return nil, &errors.AppError{Code: 500, Message: "Google OAuth not configured"}
	}

	accessToken, appErr := s.exchangeOAuthCode(s.google, code)
	if appErr != nil {
		return nil, appErr
	}

	req, err := http.NewRequest("GET", s.google.UserInfoURL, nil)
	if err != nil {
		return nil, errors.ErrInternal
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.log.Error("failed to get google user info", zap.Error(err))
		return nil, errors.ErrInternal
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		s.log.Error("google userinfo returned non-200", zap.Int("status", resp.StatusCode))
		return nil, errors.ErrInternal
	}

	var gUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := decodeJSON(resp.Body, &gUser); err != nil {
		s.log.Error("failed to decode google user info", zap.Error(err))
		return nil, errors.ErrInternal
	}

	return &OAuthUserInfo{
		Email:     gUser.Email,
		Name:      gUser.Name,
		AvatarURL: gUser.Picture,
		ID:        gUser.ID,
	}, nil
}

func (s *Service) getGithubUserInfo(ctx context.Context, code string) (*OAuthUserInfo, *errors.AppError) {
	if s.github == nil {
		return nil, &errors.AppError{Code: 500, Message: "GitHub OAuth not configured"}
	}

	accessToken, appErr := s.exchangeOAuthCode(s.github, code)
	if appErr != nil {
		return nil, appErr
	}

	req, err := http.NewRequest("GET", s.github.UserInfoURL, nil)
	if err != nil {
		return nil, errors.ErrInternal
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		s.log.Error("failed to get github user info", zap.Error(err))
		return nil, errors.ErrInternal
	}
	defer resp.Body.Close()

	var ghUser struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := decodeJSON(resp.Body, &ghUser); err != nil {
		return nil, errors.ErrInternal
	}

	email := ghUser.Email
	if email == "" {
		// Fetch primary email from /user/emails
		emailReq, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
		if err == nil {
			emailReq.Header.Set("Authorization", "Bearer "+accessToken)
			emailReq.Header.Set("Accept", "application/json")
			emailResp, err := http.DefaultClient.Do(emailReq)
			if err == nil {
				defer emailResp.Body.Close()
				var emails []struct {
					Email    string `json:"email"`
					Primary  bool   `json:"primary"`
					Verified bool   `json:"verified"`
				}
				if err := decodeJSON(emailResp.Body, &emails); err == nil {
					for _, e := range emails {
						if e.Primary && e.Verified {
							email = e.Email
							break
						}
					}
				}
			}
		}
	}

	name := ghUser.Name
	if name == "" {
		name = ghUser.Login
	}

	return &OAuthUserInfo{
		Email:     email,
		Name:      name,
		AvatarURL: ghUser.AvatarURL,
		ID:        fmt.Sprintf("%d", ghUser.ID),
	}, nil
}

func generateSecureToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
