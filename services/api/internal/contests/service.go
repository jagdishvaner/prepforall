package contests

import (
	"context"

	"github.com/prepforall/api/pkg/errors"
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

func (s *Service) List(ctx context.Context) ([]*Contest, *errors.AppError) {
	contests, err := s.repo.List(ctx)
	if err != nil {
		return nil, errors.ErrInternal
	}
	return contests, nil
}

func (s *Service) GetByID(ctx context.Context, id string) (*Contest, *errors.AppError) {
	contest, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.ErrNotFound
	}
	return contest, nil
}

func (s *Service) GetProblems(ctx context.Context, contestID string) ([]*ContestProblem, *errors.AppError) {
	problems, err := s.repo.FindProblems(ctx, contestID)
	if err != nil {
		return nil, errors.ErrNotFound
	}
	return problems, nil
}
