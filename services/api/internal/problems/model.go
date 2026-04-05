package problems

import (
	"encoding/json"
	"time"
)

type Problem struct {
	ID               string            `json:"id"`
	Slug             string            `json:"slug"`
	Title            string            `json:"title"`
	Description      string            `json:"description,omitempty"`
	Difficulty       string            `json:"difficulty"`
	Tags             []string          `json:"tags"`
	TimeLimitMs      int               `json:"time_limit_ms"`
	MemoryLimitMB    int               `json:"memory_limit_mb"`
	AcceptanceRate   float64           `json:"acceptance_rate"`
	TotalSubmissions int               `json:"total_submissions"`
	IsPublic         bool              `json:"is_public"`
	StarterCode      map[string]string `json:"starter_code,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
}

type TestCase struct {
	ID            string `json:"id"`
	ProblemID     string `json:"problem_id"`
	Input         string `json:"input"`
	Output        string `json:"output"`
	IsSample      bool   `json:"is_sample"`
	Order         int    `json:"order"`
	InputContent  string `json:"-"` // inline content (dev, no S3)
	OutputContent string `json:"-"` // inline content (dev, no S3)
}

// StarterCodeJSON is a helper for scanning JSONB from PostgreSQL
type StarterCodeJSON map[string]string

func (s *StarterCodeJSON) Scan(src interface{}) error {
	if src == nil {
		*s = make(map[string]string)
		return nil
	}
	switch v := src.(type) {
	case []byte:
		return json.Unmarshal(v, s)
	case string:
		return json.Unmarshal([]byte(v), s)
	default:
		*s = make(map[string]string)
		return nil
	}
}

type ListFilter struct {
	Difficulty string
	Tags       []string
	Search     string
	Page       int
	Limit      int
}
