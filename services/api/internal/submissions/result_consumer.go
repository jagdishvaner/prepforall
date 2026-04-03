package submissions

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prepforall/api/internal/realtime"
	"github.com/prepforall/api/pkg/metrics"
	"github.com/prepforall/api/pkg/queue"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// ResultConsumer reads verdict events from Redis Stream (results:stream).
// Only ONE API instance processes each event (XReadGroup consumer groups guarantee this).
// After writing to DB it publishes to Redis Pub/Sub so any instance can deliver to the WebSocket client.
type ResultConsumer struct {
	db         *pgxpool.Pool
	rdb        *redis.Client
	hub        *realtime.Hub
	log        *zap.Logger
	instanceID string
}

func NewResultConsumer(db *pgxpool.Pool, rdb *redis.Client, hub *realtime.Hub, log *zap.Logger) *ResultConsumer {
	hostname, _ := os.Hostname()
	return &ResultConsumer{db: db, rdb: rdb, hub: hub, log: log, instanceID: hostname}
}

func (c *ResultConsumer) Start(ctx context.Context) {
	if err := queue.EnsureConsumerGroups(ctx, c.rdb); err != nil {
		c.log.Fatal("failed to ensure consumer groups", zap.Error(err))
	}

	c.log.Sugar().Infof("Result consumer started (instance: %s)", c.instanceID)

	for {
		select {
		case <-ctx.Done():
			return
		default:
			c.poll(ctx)
		}
	}
}

func (c *ResultConsumer) poll(ctx context.Context) {
	streams, err := c.rdb.XReadGroup(ctx, &redis.XReadGroupArgs{
		Group:    queue.ConsumerGroup,
		Consumer: c.instanceID,
		Streams:  []string{queue.ResultStream, ">"},
		Count:    10,
		Block:    2 * time.Second,
	}).Result()

	if err != nil {
		return
	}

	for _, stream := range streams {
		for _, msg := range stream.Messages {
			c.process(ctx, msg)
		}
	}
}

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

	if err := c.writeVerdict(ctx, event); err != nil {
		c.log.Error("failed to write verdict to DB", zap.String("submissionId", event.SubmissionID), zap.Error(err))
		return
	}

	metrics.VerdictTotal.WithLabelValues(event.Verdict, "").Inc()

	notifyPayload, _ := json.Marshal(event)
	c.hub.Broker().Publish(ctx, event.SubmissionID, notifyPayload)

	c.ack(ctx, msg.ID)
}

func (c *ResultConsumer) writeVerdict(ctx context.Context, e queue.ResultEvent) error {
	_, err := c.db.Exec(ctx,
		`UPDATE submissions
		 SET verdict = $1, runtime_ms = $2, memory_kb = $3, judged_at = NOW()
		 WHERE id = $4`,
		e.Verdict, e.RuntimeMs, e.MemoryKB, e.SubmissionID,
	)
	return err
}

func (c *ResultConsumer) ack(ctx context.Context, msgID string) {
	c.rdb.XAck(ctx, queue.ResultStream, queue.ConsumerGroup, msgID)
}
