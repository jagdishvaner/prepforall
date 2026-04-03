package contests

import "time"

type Contest struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Type        string    `json:"type"`
	CreatedAt   time.Time `json:"created_at"`
}

type ContestProblem struct {
	ProblemID string `json:"problem_id"`
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Points    int    `json:"points"`
	Order     int    `json:"order"`
}
