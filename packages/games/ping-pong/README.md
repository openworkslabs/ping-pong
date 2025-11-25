# Ping Pong Game

This game consists of separate frontend and backend packages.

## Structure

- `frontend/` - React-based game client
- `backend/` - Go-based game server

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
go mod download
go run .
```

The backend runs on port 4000 by default.
The frontend runs on port 5173 by default and expects the backend at http://localhost:4000.

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