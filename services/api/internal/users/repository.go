package users

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByUsername(ctx context.Context, username string) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`SELECT id, username, email, role, rating, avatar_url, bio, created_at
		 FROM users WHERE username = $1`, username,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Role, &u.Rating, &u.AvatarURL, &u.Bio, &u.CreatedAt)
	return &u, err
}

func (r *Repository) GetUserStats(ctx context.Context, username string) (*UserStats, error) {
	var stats UserStats
	err := r.db.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE s.verdict = 'AC') AS total_solved,
			COUNT(*) FILTER (WHERE s.verdict = 'AC' AND p.difficulty = 'easy') AS easy_solved,
			COUNT(*) FILTER (WHERE s.verdict = 'AC' AND p.difficulty = 'medium') AS medium_solved,
			COUNT(*) FILTER (WHERE s.verdict = 'AC' AND p.difficulty = 'hard') AS hard_solved,
			COUNT(*) AS total_submissions,
			ROUND(COUNT(*) FILTER (WHERE s.verdict = 'AC') * 100.0 / NULLIF(COUNT(*), 0), 2) AS acceptance_rate
		FROM submissions s
		JOIN problems p ON p.id = s.problem_id
		JOIN users u ON u.id = s.user_id
		WHERE u.username = $1
	`, username,
	).Scan(&stats.TotalSolved, &stats.EasySolved, &stats.MediumSolved,
		&stats.HardSolved, &stats.TotalSubmissions, &stats.AcceptanceRate)
	return &stats, err
}
