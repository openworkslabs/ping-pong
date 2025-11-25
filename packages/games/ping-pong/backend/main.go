package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// --- Data models ---

type ScoreEntry struct {
	ID        int       `json:"id"`
	PlayerID  string    `json:"playerId"`
	Name      string    `json:"name"`
	Score     int       `json:"score"`
	CreatedAt time.Time `json:"createdAt"`
}

type Event struct {
	ID        int                    `json:"id"`
	Type      string                 `json:"type"`
	SessionID string                 `json:"sessionId"`
	Data      map[string]interface{} `json:"data"`
	CreatedAt time.Time              `json:"createdAt"`
}

// --- In-memory storage ---

var (
	scoresMu sync.Mutex
	scores   []ScoreEntry

	eventsMu sync.Mutex
	events   []Event
)

var defaultConfig = map[string]interface{}{
	"gravity":      -18,
	"maxBallSpeed": 32,
	"difficulty":   "normal",
}

// --- HTTP helpers ---

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// --- HTTP handlers ---

func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		writeJSON(w, http.StatusNoContent, nil)
		return
	}
	writeJSON(w, http.StatusOK, defaultConfig)
}

func handleScore(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		writeJSON(w, http.StatusNoContent, nil)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		PlayerID string `json:"playerId"`
		Name     string `json:"name"`
		Score    int    `json:"score"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if body.Score == 0 {
		http.Error(w, "score is required", http.StatusBadRequest)
		return
	}
	if body.PlayerID == "" {
		body.PlayerID = "anonymous"
	}
	if body.Name == "" {
		body.Name = "Anonymous"
	}

	scoresMu.Lock()
	defer scoresMu.Unlock()

	entry := ScoreEntry{
		ID:        len(scores) + 1,
		PlayerID:  body.PlayerID,
		Name:      body.Name,
		Score:     body.Score,
		CreatedAt: time.Now().UTC(),
	}
	scores = append(scores, entry)
	sort.Slice(scores, func(i, j int) bool { return scores[i].Score > scores[j].Score })

	writeJSON(w, http.StatusCreated, entry)
}

func handleLeaderboard(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		writeJSON(w, http.StatusNoContent, nil)
		return
	}
	scoresMu.Lock()
	defer scoresMu.Unlock()

	limit := 20
	if len(scores) < limit {
		limit = len(scores)
	}
	writeJSON(w, http.StatusOK, scores[:limit])
}

func handleEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		writeJSON(w, http.StatusNoContent, nil)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Type      string                 `json:"type"`
		SessionID string                 `json:"sessionId"`
		Data      map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if body.Type == "" {
		http.Error(w, "type is required", http.StatusBadRequest)
		return
	}

	eventsMu.Lock()
	defer eventsMu.Unlock()

	evt := Event{
		ID:        len(events) + 1,
		Type:      body.Type,
		SessionID: body.SessionID,
		Data:      body.Data,
		CreatedAt: time.Now().UTC(),
	}
	events = append(events, evt)

	writeJSON(w, http.StatusCreated, map[string]bool{"ok": true})
}

// --- WebSocket / multiplayer ---

type Client struct {
	ID   int
	Conn *websocket.Conn
}

type Room struct {
	ID      string
	Players []int
	HostID  int
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // dev only
}

var (
	clientsMu sync.Mutex
	clients   = make(map[int]*Client)

	waitingMu      sync.Mutex
	waitingPlayers []int

	roomsMu sync.Mutex
	rooms   = make(map[string]*Room)

	nextClientID = 1
)

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	clientsMu.Lock()
	id := nextClientID
	nextClientID++
	clients[id] = &Client{ID: id, Conn: conn}
	clientsMu.Unlock()

	// Send hello
	_ = conn.WriteJSON(map[string]interface{}{
		"type":     "hello",
		"clientId": id,
	})

	go readLoop(id, conn)
}

func readLoop(id int, conn *websocket.Conn) {
	defer func() {
		conn.Close()
		removeClient(id)
	}()

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}
		var msg map[string]interface{}
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}
		handleClientMessage(id, msg)
	}
}

func handleClientMessage(id int, msg map[string]interface{}) {
	t, _ := msg["type"].(string)
	switch t {
	case "join_queue":
		waitingMu.Lock()
		waitingPlayers = append(waitingPlayers, id)
		waitingMu.Unlock()
		matchPlayers()
	case "state", "input":
		broadcastToRoom(id, msg)
	}
}

func matchPlayers() {
	waitingMu.Lock()
	defer waitingMu.Unlock()

	for len(waitingPlayers) >= 2 {
		a := waitingPlayers[0]
		b := waitingPlayers[1]
		waitingPlayers = waitingPlayers[2:]

		roomID := "room-" + strconv.Itoa(a) + "-" + strconv.Itoa(b)

		roomsMu.Lock()
		rooms[roomID] = &Room{
			ID:      roomID,
			Players: []int{a, b},
			HostID:  a,
		}
		roomsMu.Unlock()

		for _, pid := range []int{a, b} {
			if c := getClient(pid); c != nil {
				_ = c.Conn.WriteJSON(map[string]interface{}{
					"type":       "room_joined",
					"roomId":     roomID,
					"youAreHost": pid == a,
				})
			}
		}
	}
}

func broadcastToRoom(senderID int, msg map[string]interface{}) {
	roomsMu.Lock()
	defer roomsMu.Unlock()

	for _, room := range rooms {
		inRoom := false
		for _, pid := range room.Players {
			if pid == senderID {
				inRoom = true
				break
			}
		}
		if !inRoom {
			continue
		}
		for _, pid := range room.Players {
			if pid == senderID {
				continue
			}
			if c := getClient(pid); c != nil {
				msg["from"] = senderID
				_ = c.Conn.WriteJSON(msg)
			}
		}
	}
}

func getClient(id int) *Client {
	clientsMu.Lock()
	defer clientsMu.Unlock()
	return clients[id]
}

func removeClient(id int) {
	clientsMu.Lock()
	delete(clients, id)
	clientsMu.Unlock()
}

// --- main ---

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/config", handleConfig)
	mux.HandleFunc("/api/score", handleScore)
	mux.HandleFunc("/api/leaderboard", handleLeaderboard)
	mux.HandleFunc("/api/event", handleEvent)
	mux.HandleFunc("/ws", handleWS)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	addr := ":" + port

	log.Printf("Go game backend listening on http://localhost%s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
