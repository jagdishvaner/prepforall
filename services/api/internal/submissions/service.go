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
