package realtime

import (
	"sync"

	"github.com/gorilla/websocket"
	"github.com/prepforall/api/pkg/metrics"
	"github.com/redis/go-redis/v9"
)

// Hub manages WebSocket connections local to this API instance.
// Cross-instance delivery is handled by broker.go via Redis Pub/Sub.
type Hub struct {
	mu      sync.RWMutex
	clients map[string]*Client // submissionID → client
	rdb     *redis.Client
	broker  *Broker
}

type Client struct {
	conn         *websocket.Conn
	submissionID string
	send         chan []byte
}

func NewHub(rdb *redis.Client) *Hub {
	h := &Hub{
		clients: make(map[string]*Client),
		rdb:     rdb,
	}
	h.broker = NewBroker(rdb, h)
	return h
}

func (h *Hub) Run() {
	go h.broker.Subscribe()
}

func (h *Hub) Register(submissionID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[submissionID] = client
	metrics.ActiveWebSockets.Inc()
}

func (h *Hub) Unregister(submissionID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if c, ok := h.clients[submissionID]; ok {
		close(c.send)
		delete(h.clients, submissionID)
		metrics.ActiveWebSockets.Dec()
	}
}

// DeliverLocal pushes a message to the local client if it exists on this instance.
func (h *Hub) DeliverLocal(submissionID string, msg []byte) {
	h.mu.RLock()
	client, ok := h.clients[submissionID]
	h.mu.RUnlock()
	if ok {
		client.send <- msg
	}
}

// Broker exposes the Redis Pub/Sub broker so the result consumer can publish verdicts.
func (h *Hub) Broker() *Broker { return h.broker }
