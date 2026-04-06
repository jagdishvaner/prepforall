package submissions

import "time"

type Submission struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	ProblemID    string     `json:"problem_id"`
	ContestID    *string    `json:"contest_id,omitempty"`
	Language     string     `json:"language"`
	Code         string     `json:"code,omitempty"`
	Verdict      string     `json:"verdict"`
	RuntimeMs    *int       `json:"runtime_ms,omitempty"`
	MemoryKB     *int       `json:"memory_kb,omitempty"`
	PassedCases  int        `json:"passed_cases"`
	TotalCases   int        `json:"total_cases"`
	CreatedAt    time.Time  `json:"created_at"`
	JudgedAt     *time.Time `json:"judged_at,omitempty"`
}

type SubmitRequest struct {
	ProblemSlug string `json:"problem_slug"`
	Language    string `json:"language"`
	Code        string `json:"code"`
	ContestID   string `json:"contest_id,omitempty"`
}

type RunRequest struct {
	ProblemSlug string `json:"problem_slug"`
	Language    string `json:"language"`
	Code        string `json:"code"`
}

type RunResponse struct {
	RunID string `json:"run_id"`
}
