package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	SubmissionStream = "submissions:queue"
	ResultStream     = "results:stream"
	ConsumerGroup    = "api-consumers"
	JudgeGroup       = "judge-workers"
)

type SubmissionJob struct {
	SubmissionID string `json:"submission_id"`
	ProblemID    string `json:"problem_id"`
	UserID       string `json:"user_id"`
	Language     string `json:"language"`
	Code         string `json:"code"`
	TimeLimitMs  int    `json:"time_limit_ms"`
	MemoryLimitMB int   `json:"memory_limit_mb"`
	EnqueuedAt   int64  `json:"enqueued_at"`
}

type ResultEvent struct {
	SubmissionID string `json:"submission_id"`
	Verdict      string `json:"verdict"`
	RuntimeMs    int    `json:"runtime_ms"`
	MemoryKB     int    `json:"memory_kb"`
	Output       string `json:"output"`
	ErrorMsg     string `json:"error_msg"`
	PassedCases  int    `json:"passed_cases"`
	TotalCases   int    `json:"total_cases"`
}

func EnqueueSubmission(ctx context.Context, rdb *redis.Client, job SubmissionJob) error {
	job.EnqueuedAt = time.Now().UnixMilli()
	data, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("marshal job: %w", err)
	}

	return rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: SubmissionStream,
		Values: map[string]interface{}{"payload": string(data)},
	}).Err()
}

func EnsureConsumerGroups(ctx context.Context, rdb *redis.Client) error {
	streams := []struct{ stream, group string }{
		{SubmissionStream, JudgeGroup},
		{ResultStream, ConsumerGroup},
	}

	for _, s := range streams {
		err := rdb.XGroupCreateMkStream(ctx, s.stream, s.group, "0").Err()
		if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
			return fmt.Errorf("create group %s: %w", s.group, err)
		}
	}
	return nil
}
