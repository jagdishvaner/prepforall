package submissions

import (
	"context"

	"github.com/google/uuid"
	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/queue"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Service struct {
	repo *Repository
	rdb  *redis.Client
	log  *zap.Logger
}

func NewService(repo *Repository, rdb *redis.Client, log *zap.Logger) *Service {
	return &Service{repo: repo, rdb: rdb, log: log}
}

func (s *Service) Submit(ctx context.Context, userID string, req SubmitRequest) (*Submission, *errors.AppError) {
	sub := &Submission{
		ID:        uuid.NewString(),
		UserID:    userID,
		ProblemID: req.ProblemID,
		Language:  req.Language,
		Code:      req.Code,
		Verdict:   "PENDING",
	}

	if err := s.repo.Create(ctx, sub); err != nil {
		s.log.Error("failed to create submission", zap.Error(err))
		return nil, errors.ErrInternal
	}

	job := queue.SubmissionJob{
		SubmissionID:  sub.ID,
		ProblemID:     sub.ProblemID,
		UserID:        userID,
		Language:      sub.Language,
		Code:          sub.Code,
		TimeLimitMs:   2000,
		MemoryLimitMB: 256,
	}

	if err := queue.EnqueueSubmission(ctx, s.rdb, job); err != nil {
		s.log.Error("failed to enqueue submission", zap.String("id", sub.ID), zap.Error(err))
		return nil, errors.ErrInternal
	}

	sub.Code = "" // don't return code in response
	return sub, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Submission, *errors.AppError) {
	sub, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.ErrNotFound
	}
	sub.Code = "" // hide code on fetch
	return sub, nil
}

func (s *Service) ListByUser(ctx context.Context, userID string) ([]*Submission, *errors.AppError) {
	subs, err := s.repo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, errors.ErrInternal
	}
	return subs, nil
}
