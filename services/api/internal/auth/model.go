package auth

import "time"

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SetupRequest struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

type InviteRequest struct {
	Email   string `json:"email"`
	Role    string `json:"role"`
	OrgID   string `json:"org_id"`
	BatchID string `json:"batch_id,omitempty"`
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

type MeResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	OrgID     string `json:"org_id,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

type Claims struct {
	UserID    string `json:"sub"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	OrgID     string `json:"org_id,omitempty"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

type OAuthAccount struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Provider   string `json:"provider"`
	ProviderID string `json:"provider_id"`
	Email      string `json:"email"`
}

type UserInvite struct {
	ID         string     `json:"id"`
	Email      string     `json:"email"`
	OrgID      string     `json:"org_id"`
	BatchID    string     `json:"batch_id,omitempty"`
	Role       string     `json:"role"`
	Token      string     `json:"token"`
	InvitedBy  string     `json:"invited_by"`
	ExpiresAt  time.Time  `json:"expires_at"`
	AcceptedAt *time.Time `json:"accepted_at,omitempty"`
}

type InviteResponse struct {
	InviteURL string `json:"invite_url"`
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

type OAuthUserInfo struct {
	Email     string
	Name      string
	AvatarURL string
	ID        string // provider-specific ID
}
