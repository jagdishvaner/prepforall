package worker

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/prepforall/judge/internal/runner"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

const (
	SubmissionStream = "submissions:queue"
	ResultStream     = "results:stream"
	JudgeGroup       = "judge-workers"
)

type TestCaseData struct {
	Input    string `json:"input"`
	Expected string `json:"expected"`
}

type SubmissionJob struct {
	SubmissionID  string         `json:"submission_id"`
	ProblemID     string         `json:"problem_id"`
	UserID        string         `json:"user_id"`
	Language      string         `json:"language"`
	Code          string         `json:"code"`
	TimeLimitMs   int            `json:"time_limit_ms"`
	MemoryLimitMB int            `json:"memory_limit_mb"`
	Mode          string         `json:"mode"`
	TestCases     []TestCaseData `json:"test_cases"`
}

type Worker struct {
	rdb        *redis.Client
	runner     *runner.Runner
	log        *zap.Logger
	instanceID string
}

func New(rdb *redis.Client, log *zap.Logger) *Worker {
	hostname, _ := os.Hostname()
	return &Worker{
		rdb:        rdb,
		runner:     runner.New(log),
		log:        log,
		instanceID: hostname,
	}
}

func (w *Worker) Start(ctx context.Context) {
	w.ensureConsumerGroup(ctx)
	w.log.Sugar().Infof("Polling submission queue (worker: %s)", w.instanceID)

	for {
		select {
		case <-ctx.Done():
			return
		default:
			w.poll(ctx)
		}
	}
}

func (w *Worker) ensureConsumerGroup(ctx context.Context) {
	err := w.rdb.XGroupCreateMkStream(ctx, SubmissionStream, JudgeGroup, "0").Err()
	if err != nil && err.Error() != "BUSYGROUP Consumer Group name already exists" {
		w.log.Fatal("failed to create consumer group", zap.Error(err))
	}
}

func (w *Worker) poll(ctx context.Context) {
	streams, err := w.rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    JudgeGroup,
		Consumer: w.instanceID,
		Streams:  []string{SubmissionStream, ">"},
		Count:    1, // process one at a time for resource isolation
		Block:    2 * time.Second,
	}).Result()

	if err != nil {
		return
	}

	for _, stream := range streams {
		for _, msg := range stream.Messages {
			w.process(ctx, msg)
			w.rdb.XAck(ctx, SubmissionStream, JudgeGroup, msg.ID)
		}
	}
}

func (w *Worker) process(ctx context.Context, msg redis.XMessage) {
	payload, _ := msg.Values["payload"].(string)
	var job SubmissionJob
	if err := json.Unmarshal([]byte(payload), &job); err != nil {
		w.log.Error("invalid job payload", zap.Error(err))
		return
	}

	w.log.Info("processing submission",
		zap.String("submissionId", job.SubmissionID),
		zap.String("language", job.Language),
		zap.String("mode", job.Mode),
	)

	// Convert job test cases to runner format
	testCases := make([]runner.TestCaseInput, len(job.TestCases))
	for i, tc := range job.TestCases {
		testCases[i] = runner.TestCaseInput{Input: tc.Input, Expected: tc.Expected}
	}

	result := w.runner.Execute(ctx, runner.ExecuteRequest{
		SubmissionID:  job.SubmissionID,
		ProblemID:     job.ProblemID,
		Language:      job.Language,
		Code:          job.Code,
		TestCases:     testCases,
		TimeLimitMs:   job.TimeLimitMs,
		MemoryLimitMB: job.MemoryLimitMB,
		Mode:          job.Mode,
	})

	w.publishResult(ctx, result)
}

func (w *Worker) publishResult(ctx context.Context, result runner.ExecuteResult) {
	data, _ := json.Marshal(result)
	w.rdb.XAdd(ctx, &redis.XAddArgs{
		Stream: ResultStream,
		Values: map[string]interface{}{"payload": string(data)},
	})
}
