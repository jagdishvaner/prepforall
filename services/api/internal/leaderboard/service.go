package leaderboard

import (
	"context"
	"fmt"
	"time"

	"github.com/prepforall/api/pkg/errors"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// Leaderboard uses Redis Sorted Sets for O(log N) rank lookups.
// Global leaderboard: key "leaderboard:global", score = user rating
// Contest leaderboard: key "contest:{id}:board", score = total points (penalty as tiebreaker)

type RankEntry struct {
	Rank     int    `json:"rank"`
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Score    int64  `json:"score"`
}

type Service struct {
	rdb *redis.Client
	log *zap.Logger
}

func NewService(rdb *redis.Client, log *zap.Logger) *Service {
	return &Service{rdb: rdb, log: log}
}

func (s *Service) GetGlobalRanking(ctx context.Context, page, limit int) ([]*RankEntry, *errors.AppError) {
	cacheKey := fmt.Sprintf("leaderboard:global:page:%d", page)
	ttl := 5 * time.Minute

	// TODO: check Redis cache first, populate from DB if miss
	_ = cacheKey
	_ = ttl

	start := int64((page - 1) * limit)
	end := start + int64(limit) - 1

	results, err := s.rdb.ZRevRangeWithScores(ctx, "leaderboard:global", start, end).Result()
	if err != nil {
		return nil, errors.ErrInternal
	}

	var entries []*RankEntry
	for i, r := range results {
		entries = append(entries, &RankEntry{
			Rank:   int(start) + i + 1,
			UserID: r.Member.(string),
			Score:  int64(r.Score),
		})
	}
	return entries, nil
}

func (s *Service) GetContestRanking(ctx context.Context, contestID string) ([]*RankEntry, *errors.AppError) {
	key := fmt.Sprintf("contest:%s:board", contestID)
	results, err := s.rdb.ZRevRangeWithScores(ctx, key, 0, 99).Result()
	if err != nil {
		return nil, errors.ErrInternal
	}

	var entries []*RankEntry
	for i, r := range results {
		entries = append(entries, &RankEntry{
			Rank:   i + 1,
			UserID: r.Member.(string),
			Score:  int64(r.Score),
		})
	}
	return entries, nil
}
