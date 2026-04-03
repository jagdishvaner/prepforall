package realtime

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: validate origin against allowed list in production
		return true
	},
}

func ServeWS(hub *Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		submissionID := r.URL.Query().Get("submission_id")
		if submissionID == "" {
			http.Error(w, "submission_id required", http.StatusBadRequest)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}

		client := &Client{
			conn:         conn,
			submissionID: submissionID,
			send:         make(chan []byte, 8),
		}

		hub.Register(submissionID, client)
		defer hub.Unregister(submissionID)

		go func() {
			for msg := range client.send {
				conn.WriteMessage(websocket.TextMessage, msg)
			}
		}()

		// Block until client disconnects
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}
}
