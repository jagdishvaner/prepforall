package contests

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

func (r *Repository) List(ctx context.Context) ([]*Contest, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, title, start_time, end_time, type, created_at
		 FROM contests ORDER BY start_time DESC LIMIT 20`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contests []*Contest
	for rows.Next() {
		var c Contest
		rows.Scan(&c.ID, &c.Title, &c.StartTime, &c.EndTime, &c.Type, &c.CreatedAt)
		contests = append(contests, &c)
	}
	return contests, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (*Contest, error) {
	var c Contest
	err := r.db.QueryRow(ctx,
		`SELECT id, title, description, start_time, end_time, type, created_at
		 FROM contests WHERE id = $1`, id,
	).Scan(&c.ID, &c.Title, &c.Description, &c.StartTime, &c.EndTime, &c.Type, &c.CreatedAt)
	return &c, err
}

func (r *Repository) FindProblems(ctx context.Context, contestID string) ([]*ContestProblem, error) {
	rows, err := r.db.Query(ctx,
		`SELECT p.id, p.slug, p.title, cp.points, cp.display_order
		 FROM contest_problems cp
		 JOIN problems p ON p.id = cp.problem_id
		 WHERE cp.contest_id = $1
		 ORDER BY cp.display_order`, contestID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var problems []*ContestProblem
	for rows.Next() {
		var cp ContestProblem
		rows.Scan(&cp.ProblemID, &cp.Slug, &cp.Title, &cp.Points, &cp.Order)
		problems = append(problems, &cp)
	}
	return problems, nil
}
