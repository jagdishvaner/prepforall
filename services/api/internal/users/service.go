package users

import (
	"context"

	"github.com/prepforall/api/pkg/errors"
	"go.uber.org/zap"
)

type Service struct {
	repo *Repository
	log  *zap.Logger
}

func NewService(repo *Repository, log *zap.Logger) *Service {
	return &Service{repo: repo, log: log}
}

func (s *Service) GetProfile(ctx context.Context, username string) (*User, *errors.AppError) {
	user, err := s.repo.FindByUsername(ctx, username)
	if err != nil {
		return nil, errors.ErrNotFound
	}
	user.Email = "" // never expose email on public profile
	return user, nil
}

func (s *Service) GetStats(ctx context.Context, username string) (*UserStats, *errors.AppError) {
	stats, err := s.repo.GetUserStats(ctx, username)
	if err != nil {
		return nil, errors.ErrNotFound
	}
	return stats, nil
}
