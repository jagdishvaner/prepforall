package leaderboard

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// Repository syncs rating data from PostgreSQL into Redis Sorted Sets.
// The Sorted Set is the primary read path — DB is the source of truth.
type Repository struct {
	db  *pgxpool.Pool
	rdb *redis.Client
}

func NewRepository(db *pgxpool.Pool, rdb *redis.Client) *Repository {
	return &Repository{db: db, rdb: rdb}
}

// SyncGlobalLeaderboard loads all user ratings from DB and rebuilds the Redis Sorted Set.
// Call this on startup and after every contest rating update.
func (r *Repository) SyncGlobalLeaderboard(ctx context.Context) error {
	rows, err := r.db.Query(ctx, `SELECT id, rating FROM users ORDER BY rating DESC`)
	if err != nil {
		return err
	}
	defer rows.Close()

	pipe := r.rdb.Pipeline()
	pipe.Del(ctx, "leaderboard:global")

	for rows.Next() {
		var userID string
		var rating float64
		if err := rows.Scan(&userID, &rating); err != nil {
			continue
		}
		pipe.ZAdd(ctx, "leaderboard:global", redis.Z{Score: rating, Member: userID})
	}

	_, err = pipe.Exec(ctx)
	return err
}

// GetUserRank returns the 1-based global rank of a user.
func (r *Repository) GetUserRank(ctx context.Context, userID string) (int64, error) {
	rank, err := r.rdb.ZRevRank(ctx, "leaderboard:global", userID).Result()
	if err != nil {
		return 0, err
	}
	return rank + 1, nil
}

// GetRatingHistory fetches the last N rating changes for a user.
func (r *Repository) GetRatingHistory(ctx context.Context, userID string, limit int) ([]RatingPoint, error) {
	rows, err := r.db.Query(ctx,
		`SELECT rh.old_rating, rh.new_rating, rh.delta, c.title, rh.created_at
		 FROM rating_history rh
		 JOIN contests c ON c.id = rh.contest_id
		 WHERE rh.user_id = $1
		 ORDER BY rh.created_at DESC
		 LIMIT $2`,
		userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []RatingPoint
	for rows.Next() {
		var p RatingPoint
		rows.Scan(&p.OldRating, &p.NewRating, &p.Delta, &p.ContestTitle, &p.CreatedAt)
		points = append(points, p)
	}
	return points, nil
}

type RatingPoint struct {
	OldRating    int    `json:"old_rating"`
	NewRating    int    `json:"new_rating"`
	Delta        int    `json:"delta"`
	ContestTitle string `json:"contest_title"`
	CreatedAt    string `json:"created_at"`
}
