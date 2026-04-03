package submissions

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

func (r *Repository) Create(ctx context.Context, s *Submission) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO submissions (id, user_id, problem_id, contest_id, language, code, verdict)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		s.ID, s.UserID, s.ProblemID, s.ContestID, s.Language, s.Code, s.Verdict,
	)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id string) (*Submission, error) {
	var s Submission
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, problem_id, contest_id, language, code, verdict,
		        runtime_ms, memory_kb, passed_cases, total_cases, created_at, judged_at
		 FROM submissions WHERE id = $1`, id,
	).Scan(&s.ID, &s.UserID, &s.ProblemID, &s.ContestID, &s.Language, &s.Code,
		&s.Verdict, &s.RuntimeMs, &s.MemoryKB, &s.PassedCases, &s.TotalCases,
		&s.CreatedAt, &s.JudgedAt)
	return &s, err
}

func (r *Repository) FindByUserID(ctx context.Context, userID string) ([]*Submission, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, problem_id, language, verdict, runtime_ms, created_at
		 FROM submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []*Submission
	for rows.Next() {
		var s Submission
		rows.Scan(&s.ID, &s.ProblemID, &s.Language, &s.Verdict, &s.RuntimeMs, &s.CreatedAt)
		subs = append(subs, &s)
	}
	return subs, nil
}
