# PixelWar ⚔

A persistent, real-time multiplayer tile-claiming game. 2,500 tiles. Unlimited players. Pure chaos.

![PixelWar](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square) ![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20WebSocket-3b82f6?style=flat-square)

## Features

- 🎮 **Real-time multiplayer** — WebSocket broadcasts every tile claim instantly to all players
- 🗂 **Persistent 50×50 grid** — 2,500 tiles stored in PostgreSQL, survive server restarts
- ⚡ **1.5s cooldown** — Redis-enforced per-user cooldown prevents spam
- 🏆 **Live leaderboard** — Top 10 players ranked by tiles claimed, updates every 3s
- ⚔ **Contested zones** — Random 5×5 zone every 90s gives 3× score weight
- 📊 **Territory bar** — Visual breakdown of territory ownership
- 🔔 **Toast notifications** — Get notified when your tiles are stolen
- 🗺 **Minimap** — 120×120px overview of the entire grid
- 🔍 **Zoom & Pan** — Mouse wheel zoom 0.5×–4×, drag to pan
- 🔄 **Auto-reconnect** — Exponential backoff with state resync on reconnect
- 🌙 **Dark theme** — Premium dark design with glassmorphism and animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Real-time | WebSocket (`ws` library) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 (cooldowns + grid cache) |
| Dev | Docker Compose |

## Quick Start

### Option 1: Docker (recommended)

```bash
# Start all services (app + Redis + PostgreSQL)
docker compose up

# Frontend dev server (in another terminal)
cd client && npm run dev
```

Then open http://localhost:5173

### Option 2: Local dev (requires PostgreSQL + Redis installed)

**1. Start Redis & PostgreSQL** (or use Docker for just the databases):

```bash
docker compose up redis postgres
```

**2. Start the server:**

```bash
cd server
cp .env.example .env   # Edit DATABASE_URL and REDIS_URL if needed
npm install
npm run dev
```

**3. Start the frontend:**

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
pixelwar/
├── client/                  # React + Vite frontend
│   └── src/
│       ├── canvas/          # HTML5 Canvas renderer + animation
│       │   ├── GridCanvas.tsx
│       │   └── useGridRenderer.ts
│       ├── components/      # UI components
│       │   ├── LandingHero.tsx
│       │   ├── JoinModal.tsx
│       │   ├── HUD.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Leaderboard.tsx
│       │   ├── EventFeed.tsx
│       │   ├── StatsSection.tsx
│       │   ├── Minimap.tsx
│       │   ├── CooldownRing.tsx
│       │   └── Toast.tsx
│       ├── pages/
│       │   └── GamePage.tsx
│       ├── store/
│       │   └── gridStore.ts  # Zustand global store
│       ├── ws/
│       │   └── useSocket.ts  # WebSocket hook with reconnect
│       └── types.ts
├── server/                  # Node.js + Express backend
│   └── src/
│       ├── index.ts         # Express server + REST endpoints
│       ├── ws.ts            # WebSocket handler + game logic
│       ├── grid.ts          # Grid state management + Redis cache
│       ├── db.ts            # PostgreSQL connection + schema init
│       ├── redis.ts         # Redis client setup
│       └── types.ts
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## WebSocket Protocol

| Direction | Message | Description |
|-----------|---------|-------------|
| Client → Server | `claim_tile {x, y, token}` | Claim a tile |
| Server → Client | `init {grid, users, you}` | Initial state on connect |
| Server → All | `tile_claimed {x,y,owner,color,...}` | Tile was claimed |
| Server → Client | `tile_rejected {x,y,reason}` | Claim rejected |
| Server → Client | `cooldown_remaining {ms}` | Cooldown duration |
| Server → All | `user_joined / user_left` | Player activity |
| Server → All | `leaderboard_update {rankings}` | Leaderboard refresh |
| Server → All | `contested_zone {x,y,width,height,endsAt}` | Zone started |
| Server ↔ Client | `heartbeat / pong` | Keep-alive |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://user:pass@localhost:5432/pixelwar` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `PORT` | `3001` | Server port |

## Game Rules

1. **Join** — Pick a username (max 16 chars) and a color
2. **Claim** — Click any tile to claim it with your color
3. **Cooldown** — 1.5 second cooldown between claims (server-enforced)
4. **Steal** — Any claimed tile can be reclaimed by another player
5. **Contested Zone** — Every 90s, a random 5×5 zone gives 3× leaderboard weight
6. **Win** — Top the leaderboard by claiming and holding the most tiles

## License

MIT
