package auth

import (
	"fmt"
	"strings"
	"time"
)

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r RegisterRequest) Validate() error {
	if len(r.Username) < 3 || len(r.Username) > 30 {
		return fmt.Errorf("username must be between 3 and 30 characters")
	}
	if !isValidEmail(r.Email) {
		return fmt.Errorf("invalid email format")
	}
	if len(r.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	return nil
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (r LoginRequest) Validate() error {
	if r.Email == "" {
		return fmt.Errorf("email is required")
	}
	if r.Password == "" {
		return fmt.Errorf("password is required")
	}
	return nil
}

type SetupRequest struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	Password string `json:"password"`
}

func (r SetupRequest) Validate() error {
	if r.Token == "" {
		return fmt.Errorf("invite token is required")
	}
	if len(r.Username) < 3 || len(r.Username) > 30 {
		return fmt.Errorf("username must be between 3 and 30 characters")
	}
	if len(r.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	return nil
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

func (r ForgotPasswordRequest) Validate() error {
	if r.Email == "" {
		return fmt.Errorf("email is required")
	}
	return nil
}

type ResetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

func (r ResetPasswordRequest) Validate() error {
	if r.Token == "" {
		return fmt.Errorf("reset token is required")
	}
	if len(r.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	return nil
}

type InviteRequest struct {
	Email   string `json:"email"`
	Role    string `json:"role"`
	OrgID   string `json:"org_id"`
	BatchID string `json:"batch_id,omitempty"`
}

func (r InviteRequest) Validate() error {
	if !isValidEmail(r.Email) {
		return fmt.Errorf("invalid email format")
	}
	validRoles := map[string]bool{"student": true, "trainer": true, "org_admin": true}
	if !validRoles[r.Role] {
		return fmt.Errorf("role must be one of: student, trainer, org_admin")
	}
	if r.OrgID == "" {
		return fmt.Errorf("org_id is required")
	}
	return nil
}

func isValidEmail(email string) bool {
	if len(email) < 3 || len(email) > 254 {
		return false
	}
	at := strings.Index(email, "@")
	dot := strings.LastIndex(email, ".")
	return at > 0 && dot > at+1 && dot < len(email)-1
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
