package problems

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/prepforall/api/pkg/errors"
	"github.com/prepforall/api/pkg/storage"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

const problemCacheTTL = time.Hour

type Service struct {
	repo *Repository
	rdb  *redis.Client
	s3   *storage.S3Client
	log  *zap.Logger
}

func NewService(repo *Repository, rdb *redis.Client, s3 *storage.S3Client, log *zap.Logger) *Service {
	return &Service{repo: repo, rdb: rdb, s3: s3, log: log}
}

func (s *Service) List(ctx context.Context, filter ListFilter) ([]*Problem, *errors.AppError) {
	problems, err := s.repo.List(ctx, filter)
	if err != nil {
		return nil, errors.ErrInternal
	}
	return problems, nil
}

func (s *Service) GetBySlug(ctx context.Context, slug string) (*Problem, *errors.AppError) {
	cacheKey := fmt.Sprintf("problem:%s", slug)

	cached, err := s.rdb.Get(ctx, cacheKey).Bytes()
	if err == nil {
		var p Problem
		if json.Unmarshal(cached, &p) == nil {
			return &p, nil
		}
	}

	problem, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, errors.ErrNotFound
	}

	if data, err := json.Marshal(problem); err == nil {
		s.rdb.Set(ctx, cacheKey, data, problemCacheTTL)
	}

	return problem, nil
}

func (s *Service) GetSampleTestCases(ctx context.Context, slug string) ([]*TestCase, *errors.AppError) {
	cacheKey := fmt.Sprintf("testcases:%s:sample", slug)

	cached, err := s.rdb.Get(ctx, cacheKey).Bytes()
	if err == nil {
		var cases []*TestCase
		if json.Unmarshal(cached, &cases) == nil {
			return cases, nil
		}
	}

	cases, dbErr := s.repo.FindSampleTestCases(ctx, slug)
	if dbErr != nil {
		return nil, errors.ErrNotFound
	}

	for _, tc := range cases {
		inputData, _ := s.s3.GetObject(ctx, tc.Input)
		outputData, _ := s.s3.GetObject(ctx, tc.Output)
		tc.Input = string(inputData)
		tc.Output = string(outputData)
	}

	if data, err := json.Marshal(cases); err == nil {
		s.rdb.Set(ctx, cacheKey, data, 30*time.Minute)
	}

	return cases, nil
}
