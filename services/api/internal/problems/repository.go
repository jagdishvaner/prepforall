package problems

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, f ListFilter) ([]*Problem, error) {
	offset := (f.Page - 1) * f.Limit
	query := `SELECT id, slug, title, difficulty, tags, acceptance_rate, total_submissions, created_at
	          FROM problems WHERE is_public = true`
	args := []interface{}{}
	argIdx := 1

	if f.Difficulty != "" {
		query += fmt.Sprintf(" AND difficulty = $%d", argIdx)
		args = append(args, f.Difficulty)
		argIdx++
	}
	if f.Search != "" {
		query += fmt.Sprintf(" AND title ILIKE $%d", argIdx)
		args = append(args, "%"+f.Search+"%")
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, f.Limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var problems []*Problem
	for rows.Next() {
		var p Problem
		rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Difficulty, &p.Tags, &p.AcceptanceRate, &p.TotalSubmissions, &p.CreatedAt)
		problems = append(problems, &p)
	}
	return problems, nil
}

func (r *Repository) FindBySlug(ctx context.Context, slug string) (*Problem, error) {
	var p Problem
	err := r.db.QueryRow(ctx,
		`SELECT id, slug, title, description, difficulty, tags, time_limit_ms,
		        memory_limit_mb, acceptance_rate, total_submissions, is_public, created_at
		 FROM problems WHERE slug = $1 AND is_public = true`, slug,
	).Scan(&p.ID, &p.Slug, &p.Title, &p.Description, &p.Difficulty, &p.Tags,
		&p.TimeLimitMs, &p.MemoryLimitMB, &p.AcceptanceRate, &p.TotalSubmissions,
		&p.IsPublic, &p.CreatedAt)
	return &p, err
}

func (r *Repository) FindSampleTestCases(ctx context.Context, slug string) ([]*TestCase, error) {
	rows, err := r.db.Query(ctx,
		`SELECT tc.id, tc.problem_id, tc.s3_input_key, tc.s3_output_key, tc.display_order
		 FROM test_cases tc
		 JOIN problems p ON p.id = tc.problem_id
		 WHERE p.slug = $1 AND tc.is_sample = true
		 ORDER BY tc.display_order`, slug,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cases []*TestCase
	for rows.Next() {
		var tc TestCase
		tc.IsSample = true
		rows.Scan(&tc.ID, &tc.ProblemID, &tc.Input, &tc.Output, &tc.Order)
		cases = append(cases, &tc)
	}
	return cases, nil
}

func (r *Repository) FindAllTestCases(ctx context.Context, problemID string) ([]*TestCase, error) {
	rows, err := r.db.Query(ctx,
		`SELECT tc.id, tc.problem_id, tc.s3_input_key, tc.s3_output_key, tc.is_sample, tc.display_order
		 FROM test_cases tc
		 WHERE tc.problem_id = $1
		 ORDER BY tc.display_order`, problemID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cases []*TestCase
	for rows.Next() {
		var tc TestCase
		if err := rows.Scan(&tc.ID, &tc.ProblemID, &tc.Input, &tc.Output, &tc.IsSample, &tc.Order); err != nil {
			return nil, fmt.Errorf("scan test case: %w", err)
		}
		cases = append(cases, &tc)
	}
	return cases, nil
}
