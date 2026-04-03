package auth

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
	ID           string
	Username     string
	Email        string
	PasswordHash string
	Role         string
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
		`SELECT id, username, email, password_hash, role FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.Role)
	return &u, err
}
