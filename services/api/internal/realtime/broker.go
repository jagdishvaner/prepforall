package realtime

import (
	"context"
	"log"
	"strings"

	"github.com/redis/go-redis/v9"
)

const pubSubPattern = "sub:*"

// Broker subscribes to Redis Pub/Sub and fans out messages to local WebSocket clients.
// This is what makes WebSocket delivery work across multiple API instances:
//   Judge worker  → PUBLISH sub:{submissionID}
//   Every instance receives it, only the one holding that WS connection delivers it.
type Broker struct {
	rdb *redis.Client
	hub *Hub
}

func NewBroker(rdb *redis.Client, hub *Hub) *Broker {
	return &Broker{rdb: rdb, hub: hub}
}

func (b *Broker) Subscribe() {
	pubsub := b.rdb.PSubscribe(context.Background(), pubSubPattern)
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		// channel is "sub:{submissionID}"
		parts := strings.SplitN(msg.Channel, ":", 2)
		if len(parts) != 2 {
			continue
		}
		submissionID := parts[1]
		b.hub.DeliverLocal(submissionID, []byte(msg.Payload))
	}

	log.Println("Redis Pub/Sub broker exited")
}

// Publish is called by the Result Consumer after writing to DB.
func (b *Broker) Publish(ctx context.Context, submissionID string, payload []byte) error {
	return b.rdb.Publish(ctx, "sub:"+submissionID, payload).Err()
}
