# First-Person Ping Pong

A small first-person ping pong prototype built with **React**, **Vite**, and **React Three Fiber** (Three.js under the hood).  
You see the paddle in front of you and track the ball flying toward you in 3D space.

## Features

- **First-person camera** looking down a neon tunnel-like court
- **3D paddle** shaped like a real table-tennis bat (oval head + handle)
- Simple but satisfying **ball physics** (bounces, spin, speed-up on hits)
- **Mouse-controlled** paddle mapping 2D screen movement into 3D space
- Minimal **HUD** showing score and ball speed

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20 is recommended)
- npm (or a compatible package manager like pnpm / yarn)

### Install dependencies

```bash
cd /Users/nicholaschen/game
npm install
```

### Run the dev server

```bash
npm run dev
```

Then open the URL printed in the terminal (typically `http://localhost:5173`).

### Build for production

```bash
npm run build
```

The bundled files will be in the `dist` directory.

## Controls

- **Mouse move**: Move the paddle in front of you.
- **Click anywhere**: Restart rally after you miss the ball.

## Tech Stack

- **React 18** + **Vite 5**
- **@react-three/fiber 8** (React renderer for Three.js)
- **Three.js** for low-level 3D primitives and materials

## Project Structure

- `index.html` – Vite entry HTML file
- `src/main.jsx` – React entrypoint
- `src/App.jsx` – UI shell and HUD overlay
- `src/GameScene.jsx` – 3D scene, physics, paddle/ball setup
- `src/styles.css` – Global styles and HUD design

## GitHub Actions

This repo includes simple CI workflows:

- `ci.yml` – Installs dependencies and runs `npm run build` on pushes & pull requests.
- `preview-build.yml` – Builds the app on pull requests and uploads the `dist` folder as an artifact.

You can customize or extend these workflows to add tests, linting, deployment, or visual regression checks.

## Backend

The game uses a lightweight **Go backend** (net/http + gorilla/websocket) in `server/`
for leaderboards, analytics, remote config and multiplayer.

Start it with:

```bash
cd server
go run .
```

It exposes the following HTTP and WebSocket endpoints on port `4000`:

- `GET /api/config`
- `POST /api/score`
- `GET /api/leaderboard`
- `POST /api/event`
- `GET /ws` (WebSocket)

### Frontend ↔ backend communication

- During development, Vite proxies `/api/*` and `/ws` requests to `http://localhost:4000`, so running `npm run dev` and `go run ./server` side-by-side just works without CORS issues.
- In production, set `VITE_API_BASE_URL` to the origin where the Go service is running (defaults to the same origin as the frontend bundle). The React app uses that value for fetch calls and to submit scores / fetch leaderboards.
- The frontend automatically submits your score when a rally ends and renders the live leaderboard + remote config that comes from the Go API.

## Future Ideas

- Webcam **hand tracking** (e.g., MediaPipe Hands) to drive the paddle instead of the mouse
- AI opponent / target zones to hit
- Spin visualization and sound design
- VR support using WebXR

