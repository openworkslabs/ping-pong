# Arcade Monorepo

A collection of browser-based games with a unified hub site.

## Structure

```
packages/
├── site/                    # Main hub website
├── games/
│   └── ping-pong/          # First-Person Ping Pong game
└── server/                  # Go backend for leaderboards & multiplayer
```

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.22+ (for backend)

### Installation

```bash
npm install
```

### Development

Run the main site:

```bash
npm run dev:site
```

Run a specific game:

```bash
npm run dev:ping-pong
```

Run the Go backend:

```bash
npm run server:go
```

### Building for Production

Build everything:

```bash
npm run build
```

## Adding a New Game

1. Create a new directory under `packages/games/your-game-name/`
2. Add a `package.json` with name `@arcade/your-game-name`
3. Set `base: "/games/your-game-name/"` in your vite config
4. Add the game to the registry in `packages/site/src/App.jsx`

## Tech Stack

- **Frontend**: React, Vite
- **3D Games**: Three.js, React Three Fiber
- **Backend**: Go with Gorilla WebSocket
