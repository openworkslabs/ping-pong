# Golf Game

A 3D golf game with separate frontend and backend packages.

## Structure

- `frontend/` - React Three Fiber based game client
- `backend/` - Go-based game server

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5174

### Backend
```bash
cd backend
go mod download
go run .
```
Runs on http://localhost:4001

## Features

- 3D golf course visualization
- 18 hole gameplay
- Score tracking
- Leaderboard support
- Multiplayer ready (WebSocket support)

## Building

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend
go build -o bin/server .
```