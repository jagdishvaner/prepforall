package problems

import "time"

type Problem struct {
	ID              string    `json:"id"`
	Slug            string    `json:"slug"`
	Title           string    `json:"title"`
	Description     string    `json:"description,omitempty"`
	Difficulty      string    `json:"difficulty"`
	Tags            []string  `json:"tags"`
	TimeLimitMs     int       `json:"time_limit_ms"`
	MemoryLimitMB   int       `json:"memory_limit_mb"`
	AcceptanceRate  float64   `json:"acceptance_rate"`
	TotalSubmissions int      `json:"total_submissions"`
	IsPublic        bool      `json:"is_public"`
	CreatedAt       time.Time `json:"created_at"`
}

type TestCase struct {
	ID        string `json:"id"`
	ProblemID string `json:"problem_id"`
	Input     string `json:"input"`
	Output    string `json:"output"`
	IsSample  bool   `json:"is_sample"`
	Order     int    `json:"order"`
}

type ListFilter struct {
	Difficulty string
	Tags       []string
	Search     string
	Page       int
	Limit      int
}
