package auth

import (
	"context"
	"database/sql"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID           string
	Username     string
	Email        string
	PasswordHash string
	Role         string
	OrgID        sql.NullString
	AvatarURL    sql.NullString
}

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, username, email, passwordHash string) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash, role)
		 VALUES ($1, $2, $3, 'user')
		 RETURNING id, username, email, role`,
		username, email, passwordHash,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Role)
	return &u, err
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, password_hash, role,
		        COALESCE(org_id::text, ''), COALESCE(avatar_url, '')
		 FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.OrgID, &u.AvatarURL)
	return &u, err
}

func (r *Repository) FindByID(ctx context.Context, id string) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, password_hash, role,
		        COALESCE(org_id::text, ''), COALESCE(avatar_url, '')
		 FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role, &u.OrgID, &u.AvatarURL)
	return &u, err
}

func (r *Repository) FindOAuthAccount(ctx context.Context, provider, providerID string) (*OAuthAccount, error) {
	var oa OAuthAccount
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, provider, provider_id, COALESCE(email, '')
		 FROM oauth_accounts WHERE provider = $1 AND provider_id = $2`,
		provider, providerID,
	).Scan(&oa.ID, &oa.UserID, &oa.Provider, &oa.ProviderID, &oa.Email)
	return &oa, err
}

func (r *Repository) CreateOAuthAccount(ctx context.Context, userID, provider, providerID, email string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO oauth_accounts (user_id, provider, provider_id, email)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (provider, provider_id) DO NOTHING`,
		userID, provider, providerID, email,
	)
	return err
}

func (r *Repository) CreateUserFromOAuth(ctx context.Context, username, email, avatarURL string) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash, role, avatar_url)
		 VALUES ($1, $2, '', 'user', $3)
		 RETURNING id, username, email, role`,
		username, email, avatarURL,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Role)
	return &u, err
}

func (r *Repository) CreateInvite(ctx context.Context, invite *UserInvite) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO user_invites (email, org_id, batch_id, role, token, invited_by, expires_at)
		 VALUES ($1, NULLIF($2, '')::uuid, NULLIF($3, '')::uuid, $4, $5, $6, $7)`,
		invite.Email, invite.OrgID, invite.BatchID, invite.Role, invite.Token, invite.InvitedBy, invite.ExpiresAt,
	)
	return err
}

func (r *Repository) FindInviteByToken(ctx context.Context, token string) (*UserInvite, error) {
	var inv UserInvite
	var orgID, batchID, invitedBy sql.NullString
	err := r.db.QueryRow(ctx,
		`SELECT id, email, COALESCE(org_id::text, ''), COALESCE(batch_id::text, ''),
		        role, token, COALESCE(invited_by::text, ''), expires_at, accepted_at
		 FROM user_invites WHERE token = $1`,
		token,
	).Scan(&inv.ID, &inv.Email, &orgID, &batchID,
		&inv.Role, &inv.Token, &invitedBy, &inv.ExpiresAt, &inv.AcceptedAt)
	if orgID.Valid {
		inv.OrgID = orgID.String
	}
	if batchID.Valid {
		inv.BatchID = batchID.String
	}
	if invitedBy.Valid {
		inv.InvitedBy = invitedBy.String
	}
	return &inv, err
}

func (r *Repository) AcceptInvite(ctx context.Context, inviteID string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE user_invites SET accepted_at = NOW() WHERE id = $1`,
		inviteID,
	)
	return err
}

func (r *Repository) CreateUserFromInvite(ctx context.Context, username, email, passwordHash, role, orgID string) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash, role, org_id)
		 VALUES ($1, $2, $3, $4, NULLIF($5, '')::uuid)
		 RETURNING id, username, email, role`,
		username, email, passwordHash, role, orgID,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Role)
	if orgID != "" {
		u.OrgID = sql.NullString{String: orgID, Valid: true}
	}
	return &u, err
}

func (r *Repository) StoreResetToken(ctx context.Context, userID, token string, expiresAt time.Time) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO password_resets (user_id, token, expires_at)
		 VALUES ($1, $2, $3)`,
		userID, token, expiresAt,
	)
	return err
}

func (r *Repository) FindResetToken(ctx context.Context, token string) (string, error) {
	var userID string
	err := r.db.QueryRow(ctx,
		`SELECT user_id FROM password_resets
		 WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
		token,
	).Scan(&userID)
	return userID, err
}

func (r *Repository) InvalidateResetToken(ctx context.Context, token string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE password_resets SET used_at = NOW() WHERE token = $1`,
		token,
	)
	return err
}

func (r *Repository) UpdatePassword(ctx context.Context, userID, passwordHash string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
		passwordHash, userID,
	)
	return err
}
