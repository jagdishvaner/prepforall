# Interactive Editor & End-to-End Code Execution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the raw problem workspace into a LeetCode-style interactive editor with working Run/Submit code execution against the existing judge service.

**Architecture:** Backend adds a `POST /submissions/run` endpoint for sample-only execution (no DB persistence) alongside the existing submit flow. Both enqueue to the same Redis Stream with test case content inline. The judge worker returns per-case results for "run" mode. Frontend gets a polished editor with starter code, enhanced toolbar, interactive test case panel, and real-time verdict display via WebSocket.

**Tech Stack:** Go (chi, pgx, go-redis), React (TanStack Query/Router, Monaco Editor, Zustand), Redis Streams, WebSocket, S3 (test case storage)

**Spec:** `docs/superpowers/specs/2026-04-05-interactive-editor-and-execution-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `apps/platform/src/features/ProblemWorkspace/ProblemDescription.tsx` | Left panel: difficulty badge, tags, acceptance rate, description HTML |
| `apps/platform/src/features/ProblemWorkspace/EditorStatusBar.tsx` | Status bar: Saved indicator + Ln/Col cursor position |
| `apps/platform/src/features/ProblemWorkspace/TestCasePanel.tsx` | Bottom panel: Testcase tab (editable inputs) + Test Result tab |
| `apps/platform/src/lib/hooks/useTestCases.ts` | Fetch sample test cases via TanStack Query |
| `apps/platform/src/lib/hooks/useSubmission.ts` | Orchestrates run/submit lifecycle + WebSocket |

### Modified Files
| File | Changes |
|------|---------|
| `services/api/pkg/queue/job.go` | Add `Mode`, `TestCases` to SubmissionJob; add `Mode`, `CaseResults` to ResultEvent |
| `services/api/internal/problems/repository.go` | Add `FindAllTestCases(problemID)` method |
| `services/api/internal/submissions/model.go` | Change SubmitRequest to use `problem_slug`; add `RunRequest` |
| `services/api/internal/submissions/handler.go` | Add `Run` handler; update RegisterRoutes signature to accept S3 client |
| `services/api/internal/submissions/service.go` | Add `Run()` method; fix `Submit()` to resolve slug, include test cases |
| `services/api/internal/submissions/result_consumer.go` | Skip DB write when `mode == "run"` |
| `services/api/cmd/api/main.go` | Pass `s3Client` to submissions.RegisterRoutes |
| `services/judge/internal/worker/worker.go` | Add `Mode`, `TestCases` to job struct; pass test cases to runner |
| `services/judge/internal/runner/runner.go` | Add `Mode` to ExecuteRequest; add `CaseResults` to ExecuteResult; run all cases in run mode |
| `apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx` | Wire all new components, useSubmission, keyboard shortcuts |
| `apps/platform/src/features/ProblemWorkspace/EditorToolbar.tsx` | Add reset, theme toggle, font size, fullscreen controls; accept isJudging prop |
| `apps/platform/src/stores/editorStore.ts` | Add `resetCode` action |
| `apps/platform/src/lib/api/submissions.ts` | Fix request payload to snake_case; type run response |
| `packages/platform-ui/src/organisms/CodeEditor.tsx` | Expose `onMount` for cursor position tracking |

---

## Task 1: Backend — Queue Models + Problems Repo

**Files:**
- Modify: `services/api/pkg/queue/job.go`
- Modify: `services/api/internal/problems/repository.go`

- [ ] **Step 1: Add Mode, TestCases to SubmissionJob and CaseResult types to job.go**

```go
// In services/api/pkg/queue/job.go — replace SubmissionJob and ResultEvent structs, add new types

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
	Mode          string         `json:"mode"` // "run" or "submit"
	TestCases     []TestCaseData `json:"test_cases"`
	EnqueuedAt    int64          `json:"enqueued_at"`
}

type CaseResult struct {
	Index          int    `json:"index"`
	Verdict        string `json:"verdict"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	ActualOutput   string `json:"actual_output"`
	RuntimeMs      int    `json:"runtime_ms"`
}

type ResultEvent struct {
	SubmissionID string       `json:"submission_id"`
	Verdict      string       `json:"verdict"`
	RuntimeMs    int          `json:"runtime_ms"`
	MemoryKB     int          `json:"memory_kb"`
	Output       string       `json:"output"`
	ErrorMsg     string       `json:"error_msg"`
	PassedCases  int          `json:"passed_cases"`
	TotalCases   int          `json:"total_cases"`
	Mode         string       `json:"mode,omitempty"`
	CaseResults  []CaseResult `json:"case_results,omitempty"`
}
```

- [ ] **Step 2: Add FindAllTestCases to problems repository**

```go
// In services/api/internal/problems/repository.go — add after FindSampleTestCases

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
		rows.Scan(&tc.ID, &tc.ProblemID, &tc.Input, &tc.Output, &tc.IsSample, &tc.Order)
		cases = append(cases, &tc)
	}
	return cases, nil
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /Users/sahilsharma/education/prepforall/services/api && go build ./...`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add services/api/pkg/queue/job.go services/api/internal/problems/repository.go
git commit -m "feat(api): add Mode and TestCases to queue job, add FindAllTestCases repo method"
```

---

## Task 2: Backend — Submissions Service (Run Endpoint + Submit Fix)

**Files:**
- Modify: `services/api/internal/submissions/model.go`
- Modify: `services/api/internal/submissions/handler.go`
- Modify: `services/api/internal/submissions/service.go`
- Modify: `services/api/cmd/api/main.go`

- [ ] **Step 1: Update model.go — fix SubmitRequest, add RunRequest**

Replace the full `SubmitRequest` struct and add `RunRequest`:

```go
// In services/api/internal/submissions/model.go — replace SubmitRequest, add RunRequest and RunResponse

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
```

- [ ] **Step 2: Update service.go — add dependencies, fix Submit, add Run**

Replace the entire `service.go` with updated Service struct and methods:

```go
package submissions

import (
	"context"

	"github.com/google/uuid"
	"github.com/prepforall/api/internal/problems"
	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/queue"
	"github.com/prepforall/api/pkg/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Service struct {
	repo        *Repository
	problemRepo *problems.Repository
	rdb         *redis.Client
	s3          *storage.S3Client
	log         *zap.Logger
}

func NewService(repo *Repository, problemRepo *problems.Repository, rdb *redis.Client, s3 *storage.S3Client, log *zap.Logger) *Service {
	return &Service{repo: repo, problemRepo: problemRepo, rdb: rdb, s3: s3, log: log}
}

func (s *Service) Submit(ctx context.Context, userID string, req SubmitRequest) (*Submission, *errors.AppError) {
	problem, err := s.problemRepo.FindBySlug(ctx, req.ProblemSlug)
	if err != nil {
		return nil, errors.ErrNotFound
	}

	sub := &Submission{
		ID:        uuid.NewString(),
		UserID:    userID,
		ProblemID: problem.ID,
		Language:  req.Language,
		Code:      req.Code,
		Verdict:   "PENDING",
	}

	if err := s.repo.Create(ctx, sub); err != nil {
		s.log.Error("failed to create submission", zap.Error(err))
		return nil, errors.ErrInternal
	}

	testCases, err := s.fetchAllTestCases(ctx, problem.ID)
	if err != nil {
		s.log.Error("failed to fetch test cases", zap.String("problemId", problem.ID), zap.Error(err))
		return nil, errors.ErrInternal
	}

	job := queue.SubmissionJob{
		SubmissionID:  sub.ID,
		ProblemID:     problem.ID,
		UserID:        userID,
		Language:      sub.Language,
		Code:          sub.Code,
		TimeLimitMs:   problem.TimeLimitMs,
		MemoryLimitMB: problem.MemoryLimitMB,
		Mode:          "submit",
		TestCases:     testCases,
	}

	if err := queue.EnqueueSubmission(ctx, s.rdb, job); err != nil {
		s.log.Error("failed to enqueue submission", zap.String("id", sub.ID), zap.Error(err))
		return nil, errors.ErrInternal
	}

	sub.Code = ""
	return sub, nil
}

func (s *Service) Run(ctx context.Context, userID string, req RunRequest) (*RunResponse, *errors.AppError) {
	problem, err := s.problemRepo.FindBySlug(ctx, req.ProblemSlug)
	if err != nil {
		return nil, errors.ErrNotFound
	}

	sampleCases, err := s.fetchSampleTestCases(ctx, req.ProblemSlug)
	if err != nil {
		s.log.Error("failed to fetch sample test cases", zap.String("slug", req.ProblemSlug), zap.Error(err))
		return nil, errors.ErrInternal
	}

	runID := uuid.NewString()

	job := queue.SubmissionJob{
		SubmissionID:  runID,
		ProblemID:     problem.ID,
		UserID:        userID,
		Language:      req.Language,
		Code:          req.Code,
		TimeLimitMs:   problem.TimeLimitMs,
		MemoryLimitMB: problem.MemoryLimitMB,
		Mode:          "run",
		TestCases:     sampleCases,
	}

	if err := queue.EnqueueSubmission(ctx, s.rdb, job); err != nil {
		s.log.Error("failed to enqueue run", zap.String("runId", runID), zap.Error(err))
		return nil, errors.ErrInternal
	}

	return &RunResponse{RunID: runID}, nil
}

func (s *Service) fetchAllTestCases(ctx context.Context, problemID string) ([]queue.TestCaseData, error) {
	cases, err := s.problemRepo.FindAllTestCases(ctx, problemID)
	if err != nil {
		return nil, err
	}
	return s.resolveTestCaseContent(ctx, cases)
}

func (s *Service) fetchSampleTestCases(ctx context.Context, slug string) ([]queue.TestCaseData, error) {
	cases, err := s.problemRepo.FindSampleTestCases(ctx, slug)
	if err != nil {
		return nil, err
	}
	return s.resolveTestCaseContent(ctx, cases)
}

func (s *Service) resolveTestCaseContent(ctx context.Context, cases []*problems.TestCase) ([]queue.TestCaseData, error) {
	result := make([]queue.TestCaseData, 0, len(cases))
	for _, tc := range cases {
		inputData, err := s.s3.GetObject(ctx, tc.Input)
		if err != nil {
			return nil, err
		}
		outputData, err := s.s3.GetObject(ctx, tc.Output)
		if err != nil {
			return nil, err
		}
		result = append(result, queue.TestCaseData{
			Input:    string(inputData),
			Expected: string(outputData),
		})
	}
	return result, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Submission, *errors.AppError) {
	sub, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.ErrNotFound
	}
	sub.Code = ""
	return sub, nil
}

func (s *Service) ListByUser(ctx context.Context, userID string) ([]*Submission, *errors.AppError) {
	subs, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, errors.ErrInternal
	}
	return subs, nil
}
```

- [ ] **Step 3: Update handler.go — add Run handler, update RegisterRoutes**

Replace the entire `handler.go`:

```go
package submissions

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prepforall/api/internal/problems"
	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/middleware"
	authMiddleware "github.com/prepforall/api/pkg/middleware"
	"github.com/prepforall/api/pkg/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(r chi.Router, db *pgxpool.Pool, rdb *redis.Client, s3 *storage.S3Client, log *zap.Logger) {
	repo := NewRepository(db)
	problemRepo := problems.NewRepository(db)
	svc := NewService(repo, problemRepo, rdb, s3, log)
	h := &Handler{service: svc}

	r.Route("/submissions", func(r chi.Router) {
		r.Use(authMiddleware.Authenticate(""))
		r.Post("/", h.Submit)
		r.Post("/run", h.Run)
		r.Get("/{id}", h.GetSubmission)
		r.Get("/", h.ListMySubmissions)
	})
}

func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var req SubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	sub, err := h.service.Submit(r.Context(), userID, req)
	if err != nil {
		errors.WriteError(w, err)
		return
	}

	errors.WriteJSON(w, http.StatusCreated, sub)
}

func (h *Handler) Run(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	var req RunRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errors.WriteError(w, errors.ErrBadRequest)
		return
	}

	resp, err := h.service.Run(r.Context(), userID, req)
	if err != nil {
		errors.WriteError(w, err)
		return
	}

	errors.WriteJSON(w, http.StatusOK, resp)
}

func (h *Handler) GetSubmission(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	sub, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		errors.WriteError(w, errors.ErrNotFound)
		return
	}
	errors.WriteJSON(w, http.StatusOK, sub)
}

func (h *Handler) ListMySubmissions(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	subs, err := h.service.ListByUser(r.Context(), userID)
	if err != nil {
		errors.WriteError(w, errors.ErrInternal)
		return
	}
	errors.WriteJSON(w, http.StatusOK, subs)
}
```

- [ ] **Step 4: Update main.go — pass s3Client to submissions**

In `services/api/cmd/api/main.go`, change line 75 from:

```go
submissions.RegisterRoutes(r, db, rdb, log)
```

to:

```go
submissions.RegisterRoutes(r, db, rdb, s3Client, log)
```

- [ ] **Step 5: Verify compilation**

Run: `cd /Users/sahilsharma/education/prepforall/services/api && go build ./...`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add services/api/internal/submissions/ services/api/cmd/api/main.go
git commit -m "feat(api): add run endpoint, fix submit to resolve slug and include test cases"
```

---

## Task 3: Backend — Result Consumer (Skip DB for Run Mode)

**Files:**
- Modify: `services/api/internal/submissions/result_consumer.go`

- [ ] **Step 1: Update process method to check mode**

In `result_consumer.go`, replace the `process` method:

```go
func (c *ResultConsumer) process(ctx context.Context, msg redis.XMessage) {
	payload, ok := msg.Values["payload"].(string)
	if !ok {
		c.ack(ctx, msg.ID)
		return
	}

	var event queue.ResultEvent
	if err := json.Unmarshal([]byte(payload), &event); err != nil {
		c.log.Error("failed to unmarshal result event", zap.Error(err))
		c.ack(ctx, msg.ID)
		return
	}

	// Only write to DB for submit mode (run mode has no submission row)
	if event.Mode != "run" {
		if err := c.writeVerdict(ctx, event); err != nil {
			c.log.Error("failed to write verdict to DB", zap.String("submissionId", event.SubmissionID), zap.Error(err))
			return
		}
		metrics.VerdictTotal.WithLabelValues(event.Verdict, "").Inc()
	}

	notifyPayload, _ := json.Marshal(event)
	c.hub.Broker().Publish(ctx, event.SubmissionID, notifyPayload)

	c.ack(ctx, msg.ID)
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/sahilsharma/education/prepforall/services/api && go build ./...`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add services/api/internal/submissions/result_consumer.go
git commit -m "feat(api): skip DB write for run-mode results in result consumer"
```

---

## Task 4: Backend — Judge Worker + Runner Updates

**Files:**
- Modify: `services/judge/internal/worker/worker.go`
- Modify: `services/judge/internal/runner/runner.go`

- [ ] **Step 1: Update worker job struct and process method**

In `worker.go`, replace the `SubmissionJob` struct and `process` method:

```go
// Replace SubmissionJob struct
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

// Replace process method
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
```

- [ ] **Step 2: Update runner ExecuteRequest, ExecuteResult, and Execute method**

In `runner.go`, add `Mode` to `ExecuteRequest`, add `CaseResult` type and `CaseResults` field to `ExecuteResult`:

```go
type ExecuteRequest struct {
	SubmissionID  string
	ProblemID     string
	Language      string
	Code          string
	TestCases     []TestCaseInput
	TimeLimitMs   int
	MemoryLimitMB int
	Mode          string // "run" or "submit"
}

type CaseResult struct {
	Index          int    `json:"index"`
	Verdict        string `json:"verdict"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	ActualOutput   string `json:"actual_output"`
	RuntimeMs      int    `json:"runtime_ms"`
}

type ExecuteResult struct {
	SubmissionID string       `json:"submission_id"`
	Verdict      string       `json:"verdict"`
	RuntimeMs    int          `json:"runtime_ms"`
	MemoryKB     int          `json:"memory_kb"`
	Output       string       `json:"output"`
	ErrorMsg     string       `json:"error_msg"`
	PassedCases  int          `json:"passed_cases"`
	TotalCases   int          `json:"total_cases"`
	Mode         string       `json:"mode,omitempty"`
	CaseResults  []CaseResult `json:"case_results,omitempty"`
}
```

- [ ] **Step 3: Update Execute method — run all cases in run mode, collect per-case results**

Replace the `Execute` method's test case loop (from `result := ExecuteResult{` through `return result` at end of function):

```go
	result := ExecuteResult{
		SubmissionID: req.SubmissionID,
		TotalCases:   len(req.TestCases),
		Mode:         req.Mode,
	}

	isRunMode := req.Mode == "run"
	if isRunMode {
		result.CaseResults = make([]CaseResult, 0, len(req.TestCases))
	}

	for i, tc := range req.TestCases {
		verdict, runtimeMs, output, errMsg := r.runTestCase(ctx, sandbox, lang, tc)
		if runtimeMs > result.RuntimeMs {
			result.RuntimeMs = runtimeMs
		}

		if isRunMode {
			result.CaseResults = append(result.CaseResults, CaseResult{
				Index:          i,
				Verdict:        verdict,
				Input:          tc.Input,
				ExpectedOutput: tc.Expected,
				ActualOutput:   output,
				RuntimeMs:      runtimeMs,
			})
		}

		if verdict == VerdictAC {
			result.PassedCases++
		} else {
			// In submit mode, stop on first failure
			if !isRunMode {
				result.Verdict = verdict
				result.Output = output
				result.ErrorMsg = errMsg
				return result
			}
		}
	}

	if result.PassedCases == result.TotalCases {
		result.Verdict = VerdictAC
	} else {
		// In run mode, set verdict to first non-AC case
		for _, cr := range result.CaseResults {
			if cr.Verdict != VerdictAC {
				result.Verdict = cr.Verdict
				break
			}
		}
		if result.Verdict == "" {
			result.Verdict = VerdictWA
		}
	}

	return result
```

- [ ] **Step 4: Verify compilation**

Run: `cd /Users/sahilsharma/education/prepforall/services/judge && go build ./...`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add services/judge/internal/worker/worker.go services/judge/internal/runner/runner.go
git commit -m "feat(judge): accept test cases from job, return per-case results for run mode"
```

---

## Task 5: Frontend — ProblemDescription Component

**Files:**
- Create: `apps/platform/src/features/ProblemWorkspace/ProblemDescription.tsx`

- [ ] **Step 1: Create ProblemDescription component**

```tsx
// apps/platform/src/features/ProblemWorkspace/ProblemDescription.tsx
import { cn } from '@prepforall/platform-ui/lib';

const difficultyColors: Record<string, string> = {
  easy: 'text-green-500',
  medium: 'text-yellow-500',
  hard: 'text-red-500',
};

interface ProblemDescriptionProps {
  title: string;
  difficulty: string;
  tags: string[];
  acceptanceRate?: number;
  description: string;
}

export function ProblemDescription({
  title,
  difficulty,
  tags,
  acceptanceRate,
  description,
}: ProblemDescriptionProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <h1 className="text-xl font-bold mb-2">{title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={cn(
              'text-sm font-semibold capitalize',
              difficultyColors[difficulty] || 'text-muted-foreground'
            )}
          >
            {difficulty}
          </span>
          {acceptanceRate != null && (
            <span className="text-sm text-muted-foreground">
              Acceptance: {acceptanceRate.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <div
          className="prose prose-sm dark:prose-invert max-w-none
                     prose-pre:bg-muted prose-pre:text-foreground
                     prose-code:before:content-none prose-code:after:content-none
                     prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/sahilsharma/education/prepforall && pnpm --filter platform typecheck`
Expected: no errors (or only pre-existing errors)

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/features/ProblemWorkspace/ProblemDescription.tsx
git commit -m "feat(platform): add ProblemDescription component with difficulty badge and tags"
```

---

## Task 6: Frontend — Enhanced EditorToolbar + EditorStatusBar + CodeEditor Cursor

**Files:**
- Modify: `apps/platform/src/features/ProblemWorkspace/EditorToolbar.tsx`
- Create: `apps/platform/src/features/ProblemWorkspace/EditorStatusBar.tsx`
- Modify: `packages/platform-ui/src/organisms/CodeEditor.tsx`
- Modify: `apps/platform/src/stores/editorStore.ts`

- [ ] **Step 1: Add resetCode and default starter templates to editorStore**

In `apps/platform/src/stores/editorStore.ts`, add to the interface, implementation, and export templates:

Add to `EditorState` interface:
```typescript
resetCode: (slug: string, language: string, starterCode: string) => void;
```

Add to the store implementation (after `getCode`):
```typescript
resetCode: (slug, language, starterCode) =>
  set((state) => ({
    savedCodes: {
      ...state.savedCodes,
      [slug]: { ...state.savedCodes[slug], [language]: starterCode },
    },
  })),
```

Add after `SUPPORTED_LANGUAGES` at the end of the file — default templates used when `problem.starterCode` is not available from the backend:

```typescript
export const DEFAULT_STARTER_CODE: Record<string, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read input and write your solution here
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    // Read input and write your solution here
    return 0;
}
`,
  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input and write your solution here
    }
}
`,
  python: `# Read input and write your solution here
`,
  javascript: `// Read input and write your solution here
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });

const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    // Process input from lines array
});
`,
  go: `package main

import "fmt"

func main() {
    // Read input and write your solution here
    fmt.Println()
}
`,
};
```

- [ ] **Step 2: Update CodeEditor to expose cursor position**

In `packages/platform-ui/src/organisms/CodeEditor.tsx`, add an `onCursorChange` prop:

Add to `CodeEditorProps` interface:
```typescript
onCursorChange?: (line: number, column: number) => void;
```

Add to destructured props:
```typescript
onCursorChange,
```

Update the `onMount` prop on `<Editor>`:
```typescript
onMount={(editor) => {
  onMount?.(editor, undefined as any);
  if (onCursorChange) {
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange(e.position.lineNumber, e.position.column);
    });
  }
}}
```

Note: Remove the existing `onMount={onMount}` prop and replace with the above.

- [ ] **Step 3: Replace EditorToolbar.tsx**

```tsx
// apps/platform/src/features/ProblemWorkspace/EditorToolbar.tsx
import { useEditorStore, SUPPORTED_LANGUAGES } from '@/stores/editorStore';
import { Play, Send, RotateCcw, Sun, Moon, Maximize2, Minimize2 } from 'lucide-react';

interface EditorToolbarProps {
  slug: string;
  starterCode?: Record<string, string>;
  isJudging: boolean;
  isFullscreen: boolean;
  onRun: () => void;
  onSubmit: () => void;
  onToggleFullscreen: () => void;
}

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20];

export function EditorToolbar({
  slug,
  starterCode,
  isJudging,
  isFullscreen,
  onRun,
  onSubmit,
  onToggleFullscreen,
}: EditorToolbarProps) {
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize, resetCode } =
    useEditorStore();

  const handleReset = () => {
    const code = starterCode?.[language] ?? '';
    if (confirm('Reset code to starter template? Your changes will be lost.')) {
      resetCode(slug, language, code);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5">
      {/* Left: Language selector */}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1 text-sm"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Center: Editor controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleReset}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Reset to starter code"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Toggle theme"
        >
          {theme === 'vs-dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
        <select
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="rounded border border-border bg-background px-1.5 py-1 text-xs"
          title="Font size"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
        <button
          onClick={onToggleFullscreen}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Right: Run + Submit */}
      <div className="flex gap-2">
        <button
          onClick={onRun}
          disabled={isJudging}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          Run
        </button>
        <button
          onClick={onSubmit}
          disabled={isJudging}
          className="flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Submit
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create EditorStatusBar component**

```tsx
// apps/platform/src/features/ProblemWorkspace/EditorStatusBar.tsx

interface EditorStatusBarProps {
  line: number;
  column: number;
}

export function EditorStatusBar({ line, column }: EditorStatusBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
      <span>Saved</span>
      <span>
        Ln {line}, Col {column}
      </span>
    </div>
  );
}
```

- [ ] **Step 5: Verify it compiles**

Run: `cd /Users/sahilsharma/education/prepforall && pnpm --filter platform typecheck`
Expected: no type errors from the new/modified files

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/features/ProblemWorkspace/EditorToolbar.tsx \
  apps/platform/src/features/ProblemWorkspace/EditorStatusBar.tsx \
  packages/platform-ui/src/organisms/CodeEditor.tsx \
  apps/platform/src/stores/editorStore.ts
git commit -m "feat(platform): enhanced editor toolbar, status bar, cursor tracking, and reset code"
```

---

## Task 7: Frontend — useTestCases Hook + TestCasePanel Component

**Files:**
- Create: `apps/platform/src/lib/hooks/useTestCases.ts`
- Create: `apps/platform/src/features/ProblemWorkspace/TestCasePanel.tsx`

- [ ] **Step 1: Create useTestCases hook**

```tsx
// apps/platform/src/lib/hooks/useTestCases.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { apiClient } from '../apiClient';

export interface SampleTestCase {
  id: string;
  input: string;
  output: string;
  order: number;
}

export function useTestCases(slug: string) {
  return useQuery({
    queryKey: queryKeys.problems.testCases(slug),
    queryFn: async () => {
      const { data } = await apiClient.get<SampleTestCase[]>(
        `/api/v1/problems/${slug}/testcases/sample`
      );
      return data;
    },
    staleTime: 10 * 60_000,
    enabled: !!slug,
  });
}
```

- [ ] **Step 2: Create TestCasePanel component**

```tsx
// apps/platform/src/features/ProblemWorkspace/TestCasePanel.tsx
import { useState } from 'react';
import { VerdictBadge, type Verdict } from '@prepforall/platform-ui/atomic';
import { cn } from '@prepforall/platform-ui/lib';
import type { SampleTestCase } from '@/lib/hooks/useTestCases';

interface CaseResultItem {
  index: number;
  verdict: string;
  input: string;
  expected_output: string;
  actual_output: string;
  runtime_ms: number;
}

interface SubmissionResult {
  submission_id: string;
  verdict: string;
  runtime_ms: number;
  memory_kb: number;
  passed_cases: number;
  total_cases: number;
  error_msg?: string;
  mode?: string;
  case_results?: CaseResultItem[];
}

interface TestCasePanelProps {
  testCases: SampleTestCase[];
  result: SubmissionResult | null;
  isJudging: boolean;
  mode: 'run' | 'submit' | null;
}

export function TestCasePanel({ testCases, result, isJudging, mode }: TestCasePanelProps) {
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>(
    result ? 'result' : 'testcase'
  );
  const [selectedCase, setSelectedCase] = useState(0);

  // Auto-switch to result tab when result arrives
  const currentTab = isJudging || result ? 'result' : activeTab;

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-muted/30 px-3">
        <button
          onClick={() => setActiveTab('testcase')}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            currentTab === 'testcase'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Testcase
        </button>
        <button
          onClick={() => setActiveTab('result')}
          className={cn(
            'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            currentTab === 'result'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Test Result
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentTab === 'testcase' ? (
          <TestcaseTab
            testCases={testCases}
            selectedCase={selectedCase}
            onSelectCase={setSelectedCase}
          />
        ) : (
          <ResultTab result={result} isJudging={isJudging} mode={mode} />
        )}
      </div>
    </div>
  );
}

function TestcaseTab({
  testCases,
  selectedCase,
  onSelectCase,
}: {
  testCases: SampleTestCase[];
  selectedCase: number;
  onSelectCase: (i: number) => void;
}) {
  if (testCases.length === 0) {
    return <p className="text-sm text-muted-foreground">No sample test cases available.</p>;
  }

  const tc = testCases[selectedCase];
  const inputLines = tc?.input.trim().split('\n') ?? [];

  return (
    <div>
      {/* Case tabs */}
      <div className="flex gap-2 mb-4">
        {testCases.map((_, i) => (
          <button
            key={i}
            onClick={() => onSelectCase(i)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium',
              selectedCase === i
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            Case {i + 1}
          </button>
        ))}
      </div>

      {/* Input display */}
      {inputLines.map((line, i) => (
        <div key={i} className="mb-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Input {i + 1}
          </label>
          <div className="rounded bg-muted px-3 py-2 font-mono text-sm">{line}</div>
        </div>
      ))}

      {/* Expected output */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Expected Output
        </label>
        <div className="rounded bg-muted px-3 py-2 font-mono text-sm">
          {tc?.output.trim()}
        </div>
      </div>
    </div>
  );
}

function ResultTab({
  result,
  isJudging,
  mode,
}: {
  result: SubmissionResult | null;
  isJudging: boolean;
  mode: 'run' | 'submit' | null;
}) {
  if (isJudging) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Judge is evaluating your code...</span>
      </div>
    );
  }

  if (!result) {
    return <p className="text-sm text-muted-foreground">Run or submit to see results.</p>;
  }

  // Compilation error — show error for both modes
  if (result.verdict === 'CE') {
    return (
      <div>
        <VerdictBadge verdict="CE" className="mb-3" />
        {result.error_msg && (
          <pre className="rounded bg-destructive/10 p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
            {result.error_msg}
          </pre>
        )}
      </div>
    );
  }

  // Run mode — per-case results
  if (mode === 'run' && result.case_results?.length) {
    return <RunModeResults result={result} />;
  }

  // Submit mode — aggregate results
  return <SubmitModeResults result={result} />;
}

function RunModeResults({ result }: { result: SubmissionResult }) {
  const [selectedCase, setSelectedCase] = useState(0);
  const cases = result.case_results ?? [];
  const cr = cases[selectedCase];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <VerdictBadge verdict={result.verdict as Verdict} />
        <span className="text-sm text-muted-foreground">
          {result.passed_cases}/{result.total_cases} test cases passed
        </span>
      </div>

      {/* Case tabs */}
      <div className="flex gap-2 mb-4">
        {cases.map((c, i) => (
          <button
            key={i}
            onClick={() => setSelectedCase(i)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium flex items-center gap-1',
              selectedCase === i ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <span className={c.verdict === 'AC' ? 'text-green-500' : 'text-red-500'}>
              {c.verdict === 'AC' ? '\u2713' : '\u2717'}
            </span>
            Case {i + 1}
          </button>
        ))}
      </div>

      {cr && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Input</label>
            <pre className="rounded bg-muted px-3 py-2 font-mono text-sm whitespace-pre-wrap">
              {cr.input.trim()}
            </pre>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Expected Output
            </label>
            <pre className="rounded bg-muted px-3 py-2 font-mono text-sm whitespace-pre-wrap">
              {cr.expected_output.trim()}
            </pre>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Your Output
            </label>
            <pre
              className={cn(
                'rounded px-3 py-2 font-mono text-sm whitespace-pre-wrap',
                cr.verdict === 'AC' ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              {cr.actual_output.trim() || '(no output)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmitModeResults({ result }: { result: SubmissionResult }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <VerdictBadge verdict={result.verdict as Verdict} />
        {result.runtime_ms != null && (
          <span className="text-sm text-muted-foreground">Runtime: {result.runtime_ms}ms</span>
        )}
        {result.memory_kb != null && (
          <span className="text-sm text-muted-foreground">
            Memory: {(result.memory_kb / 1024).toFixed(1)}MB
          </span>
        )}
        <span className="text-sm text-muted-foreground">
          {result.passed_cases}/{result.total_cases} passed
        </span>
      </div>
      {result.error_msg && (
        <pre className="rounded bg-destructive/10 p-3 text-sm text-destructive font-mono whitespace-pre-wrap">
          {result.error_msg}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/sahilsharma/education/prepforall && pnpm --filter platform typecheck`
Expected: no type errors

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/lib/hooks/useTestCases.ts \
  apps/platform/src/features/ProblemWorkspace/TestCasePanel.tsx
git commit -m "feat(platform): add useTestCases hook and TestCasePanel with run/submit result views"
```

---

## Task 8: Frontend — Execution Flow + ProblemWorkspace Wiring

**Files:**
- Modify: `apps/platform/src/lib/api/submissions.ts`
- Create: `apps/platform/src/lib/hooks/useSubmission.ts`
- Modify: `apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx`

- [ ] **Step 1: Fix submissions API client — send snake_case, type responses**

Replace entire `apps/platform/src/lib/api/submissions.ts`:

```typescript
import { apiClient } from '../apiClient';

export interface SubmitRequest {
  problemSlug: string;
  language: string;
  code: string;
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  language: string;
  verdict: string;
  runtime_ms?: number;
  memory_kb?: number;
  passed_cases: number;
  total_cases: number;
  error_msg?: string;
  created_at: string;
}

export const submissionsApi = {
  submit: async (req: SubmitRequest) => {
    const { data } = await apiClient.post<Submission>('/api/v1/submissions', {
      problem_slug: req.problemSlug,
      language: req.language,
      code: req.code,
    });
    return data;
  },
  run: async (req: SubmitRequest) => {
    const { data } = await apiClient.post<{ run_id: string }>('/api/v1/submissions/run', {
      problem_slug: req.problemSlug,
      language: req.language,
      code: req.code,
    });
    return data;
  },
  getByProblem: async (slug: string) => {
    const { data } = await apiClient.get<Submission[]>(`/api/v1/problems/${slug}/submissions`);
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<Submission>(`/api/v1/submissions/${id}`);
    return data;
  },
};
```

- [ ] **Step 2: Create useSubmission hook**

```tsx
// apps/platform/src/lib/hooks/useSubmission.ts
import { useState, useCallback } from 'react';
import { submissionsApi } from '../api/submissions';
import { useSubmissionResult } from './useSubmissionResult';
import { toast } from 'sonner';

export type ExecutionMode = 'run' | 'submit' | null;

export function useSubmission(slug: string) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<ExecutionMode>(null);
  const { result, isJudging } = useSubmissionResult(activeId);

  const run = useCallback(
    async (code: string, language: string) => {
      if (!code.trim()) {
        toast.error('Please write some code first');
        return;
      }
      try {
        const { run_id } = await submissionsApi.run({
          problemSlug: slug,
          language,
          code,
        });
        setMode('run');
        setActiveId(run_id);
      } catch {
        toast.error('Failed to run code. Please try again.');
      }
    },
    [slug]
  );

  const submit = useCallback(
    async (code: string, language: string) => {
      if (!code.trim()) {
        toast.error('Please write some code first');
        return;
      }
      try {
        const data = await submissionsApi.submit({
          problemSlug: slug,
          language,
          code,
        });
        setMode('submit');
        setActiveId(data.id);
      } catch {
        toast.error('Failed to submit code. Please try again.');
      }
    },
    [slug]
  );

  return { run, submit, result, isJudging, mode };
}
```

- [ ] **Step 3: Replace ProblemWorkspace.tsx — wire all components**

Replace entire `apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { CodeEditor } from '@prepforall/platform-ui/organisms';
import { useEditorStore, DEFAULT_STARTER_CODE } from '@/stores/editorStore';
import { useProblem } from '@/lib/hooks/useProblems';
import { useTestCases } from '@/lib/hooks/useTestCases';
import { useSubmission } from '@/lib/hooks/useSubmission';
import { ProblemDescription } from './ProblemDescription';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { TestCasePanel } from './TestCasePanel';

interface Props {
  slug: string;
}

export function ProblemWorkspace({ slug }: Props) {
  const { data: problem, isLoading } = useProblem(slug);
  const { data: testCases = [] } = useTestCases(slug);
  const { language, theme, fontSize, tabSize, getCode, setCode } = useEditorStore();
  const { run, submit, result, isJudging, mode } = useSubmission(slug);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load starter code if no saved code exists (prefer problem-specific, fallback to generic)
  let code = getCode(slug, language);
  if (!code) {
    const starter = problem?.starterCode?.[language] ?? DEFAULT_STARTER_CODE[language] ?? '';
    if (starter) {
      code = starter;
      setCode(slug, language, code);
    }
  }

  const handleRun = useCallback(() => {
    run(getCode(slug, language), language);
  }, [run, getCode, slug, language]);

  const handleSubmit = useCallback(() => {
    submit(getCode(slug, language), language);
  }, [submit, getCode, slug, language]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (mod && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      } else if (mod && e.key === 's') {
        e.preventDefault(); // prevent browser save dialog
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun, handleSubmit]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading problem...
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        Problem not found.
      </div>
    );
  }

  return (
    <PanelGroup direction="horizontal" className="h-full">
      {/* Left: Problem description */}
      {!isFullscreen && (
        <>
          <Panel defaultSize={40} minSize={25}>
            <ProblemDescription
              title={problem.title}
              difficulty={problem.difficulty ?? 'easy'}
              tags={problem.tags ?? []}
              acceptanceRate={problem.acceptanceRate}
              description={problem.description ?? ''}
            />
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
        </>
      )}

      {/* Right: Editor + Test cases */}
      <Panel defaultSize={isFullscreen ? 100 : 60} minSize={30}>
        <PanelGroup direction="vertical">
          {/* Editor */}
          <Panel defaultSize={65} minSize={30}>
            <div className="flex h-full flex-col">
              <EditorToolbar
                slug={slug}
                starterCode={problem.starterCode}
                isJudging={isJudging}
                isFullscreen={isFullscreen}
                onRun={handleRun}
                onSubmit={handleSubmit}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              />
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  language={language}
                  theme={theme}
                  fontSize={fontSize}
                  tabSize={tabSize}
                  onChange={(val) => setCode(slug, language, val ?? '')}
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                />
              </div>
              <EditorStatusBar line={cursorPos.line} column={cursorPos.col} />
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors" />

          {/* Test Cases / Results */}
          <Panel defaultSize={35} minSize={15}>
            <TestCasePanel
              testCases={testCases}
              result={result}
              isJudging={isJudging}
              mode={mode}
            />
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /Users/sahilsharma/education/prepforall && pnpm --filter platform typecheck`
Expected: no type errors

- [ ] **Step 5: Manual smoke test**

1. Run: `cd /Users/sahilsharma/education/prepforall && pnpm dev`
2. Open `http://localhost:5173/problems/two-sum`
3. Verify:
   - Left panel shows difficulty badge, tags, formatted description
   - Editor loads starter code for selected language
   - Toolbar has language selector, reset, theme toggle, font size, fullscreen
   - Status bar shows Ln/Col
   - Switching languages loads correct starter code
   - Reset button reloads starter code (with confirm dialog)
   - Bottom panel shows Testcase/Test Result tabs with sample cases
   - Ctrl+Enter triggers Run (toast or request if backend running)
   - Ctrl+Shift+Enter triggers Submit
   - Fullscreen hides left panel

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/lib/api/submissions.ts \
  apps/platform/src/lib/hooks/useSubmission.ts \
  apps/platform/src/features/ProblemWorkspace/ProblemWorkspace.tsx
git commit -m "feat(platform): wire end-to-end execution flow with keyboard shortcuts and full workspace"
```

---

## Verification Checklist

After all tasks:

- [ ] `cd services/api && go build ./...` — API compiles
- [ ] `cd services/judge && go build ./...` — Judge compiles
- [ ] `pnpm --filter platform typecheck` — Frontend type-checks
- [ ] Manual test: Open problem page, verify editor loads starter code
- [ ] Manual test: Run button sends request to `/api/v1/submissions/run`
- [ ] Manual test: Submit button sends request to `/api/v1/submissions`
- [ ] Manual test: WebSocket receives verdict, Test Result tab displays it
- [ ] Manual test: Keyboard shortcuts work (Ctrl+Enter, Ctrl+Shift+Enter)
