package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type ScoreEntry struct {
	ID        int       `json:"id"`
	PlayerID  string    `json:"playerId"`
	Name      string    `json:"name"`
	Score     int       `json:"score"`
	Holes     int       `json:"holes"`
	Par       int       `json:"par"`
	CreatedAt time.Time `json:"createdAt"`
}

type GameState struct {
	ID        string                 `json:"id"`
	Players   []string               `json:"players"`
	CurrentHole int                  `json:"currentHole"`
	Scores    map[string][]int       `json:"scores"`
	Status    string                 `json:"status"`
	Data      map[string]interface{} `json:"data"`
}

var (
	scoresMu sync.Mutex
	scores   []ScoreEntry

	gameStatesMu sync.Mutex
	gameStates   = make(map[string]*GameState)
)

var defaultConfig = map[string]interface{}{
	"windSpeed":    5,
	"friction":     0.98,
	"maxPower":     100,
	"difficulty":   "normal",
	"totalHoles":   18,
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

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
		Holes    int    `json:"holes"`
		Par      int    `json:"par"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	scoresMu.Lock()
	defer scoresMu.Unlock()

	entry := ScoreEntry{
		ID:        len(scores) + 1,
		PlayerID:  body.PlayerID,
		Name:      body.Name,
		Score:     body.Score,
		Holes:     body.Holes,
		Par:       body.Par,
		CreatedAt: time.Now().UTC(),
	}
	scores = append(scores, entry)

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

type Client struct {
	ID     int
	Conn   *websocket.Conn
	RoomID string
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var (
	clientsMu    sync.Mutex
	clients      = make(map[int]*Client)
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
	case "create_room":
		createRoom(id)
	case "join_room":
		roomID, _ := msg["roomId"].(string)
		joinRoom(id, roomID)
	case "game_action":
		broadcastToRoom(id, msg)
	}
}

func createRoom(clientID int) {
	roomID := "golf-" + time.Now().Format("150405")

	gameStatesMu.Lock()
	gameStates[roomID] = &GameState{
		ID:          roomID,
		Players:     []string{},
		CurrentHole: 1,
		Scores:      make(map[string][]int),
		Status:      "waiting",
		Data:        make(map[string]interface{}),
	}
	gameStatesMu.Unlock()

	clientsMu.Lock()
	if client, ok := clients[clientID]; ok {
		client.RoomID = roomID
		_ = client.Conn.WriteJSON(map[string]interface{}{
			"type":   "room_created",
			"roomId": roomID,
		})
	}
	clientsMu.Unlock()
}

func joinRoom(clientID int, roomID string) {
	gameStatesMu.Lock()
	defer gameStatesMu.Unlock()

	if gameState, ok := gameStates[roomID]; ok {
		clientsMu.Lock()
		if client, ok := clients[clientID]; ok {
			client.RoomID = roomID
			_ = client.Conn.WriteJSON(map[string]interface{}{
				"type":      "room_joined",
				"roomId":    roomID,
				"gameState": gameState,
			})
		}
		clientsMu.Unlock()
	}
}

func broadcastToRoom(senderID int, msg map[string]interface{}) {
	clientsMu.Lock()
	sender, ok := clients[senderID]
	if !ok {
		clientsMu.Unlock()
		return
	}
	roomID := sender.RoomID
	clientsMu.Unlock()

	if roomID == "" {
		return
	}

	clientsMu.Lock()
	defer clientsMu.Unlock()
	for _, client := range clients {
		if client.RoomID == roomID && client.ID != senderID {
			msg["from"] = senderID
			_ = client.Conn.WriteJSON(msg)
		}
	}
}

func removeClient(id int) {
	clientsMu.Lock()
	delete(clients, id)
	clientsMu.Unlock()
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/config", handleConfig)
	mux.HandleFunc("/api/score", handleScore)
	mux.HandleFunc("/api/leaderboard", handleLeaderboard)
	mux.HandleFunc("/ws", handleWS)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4001"
	}
	addr := ":" + port

	log.Printf("Golf game backend listening on http://localhost%s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}