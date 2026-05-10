# PixelWar ⚔

A real-time multiplayer tile-claiming game. 2,500 tiles. Unlimited players. Pure chaos.

![GridWar](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square) ![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20WebSocket-3b82f6?style=flat-square)

**🟢 Live Demo:** [https://pixel-war-topaz.vercel.app/]

## Features

- 🎮 **Real-time multiplayer** — Socket.IO broadcasts every tile claim instantly to all players
- 🗂 **Volatile 50×50 grid** — 2,500 tiles stored entirely in-memory for maximum speed
- ⚡ **1.5s cooldown** — Server-enforced per-user cooldown prevents spam
- 🏆 **Live leaderboard** — Top 10 players ranked by tiles claimed, updates live
- ⚔ **Contested zones** — Random 5×5 zone every 90s gives 3× score weight
- 📊 **Territory bar** — Visual breakdown of territory ownership
- 🔔 **Toast notifications** — Get notified when your tiles are stolen
- 🗺 **Minimap** — 120×120px overview of the entire grid
- 🔍 **Zoom & Pan** — Mouse wheel zoom 0.5×–4×, drag to pan
- 🔄 **Auto-reconnect** — Built-in Socket.IO exponential backoff with state resync
- 🌙 **Dark theme** — Premium dark design with glassmorphism and animations
- 🚀 **Cold Boot UI** — Gracefully handles free-tier server sleeping states with animated loaders

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| State | Zustand |
| Backend | Node.js + Express + TypeScript |
| Real-time | Socket.IO |
| Architecture| Single-file in-memory server (No Database/Redis needed) |

## Quick Start

You can run both the frontend and backend servers simultaneously with a single command from the project root.

```bash
# 1. Install all dependencies for root, client, and server
npm run install:all

# 2. Start the development servers
npm start
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

## Project Structure

```
gridwar/
├── client/                  # React + Vite frontend
│   ├── .env.example         # Template for deployment variables
│   └── src/
│       ├── canvas/          # HTML5 Canvas renderer + animation
│       ├── components/      # UI components (HUD, Sidebar, LandingHero)
│       ├── pages/           # Main views (GamePage)
│       ├── store/           # Zustand global state (gridStore.ts)
│       └── ws/              # Socket.IO client logic (useSocket.ts)
├── server/                  # Node.js + Express backend
│   └── src/
│       └── index.ts         # Everything! Express + Socket.IO + In-memory state
└── package.json             # Root workspace orchestration
```

## Socket.IO Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `join` | `{ username, color }` |
| Client → Server | `claim_tile` | `{ x, y }` |
| Server → Client | `init` | Initial grid state, users, leaderboard, etc. |
| Server → All | `tile_claimed` | `x, y, owner, username, color, timestamp, prevOwner` |
| Server → Client | `tile_rejected` | `x, y, reason` |
| Server → Client | `cooldown_remaining` | `ms` |
| Server → All | `user_joined` / `user_left` | Player session updates |
| Server → All | `leaderboard_update` | Array of top 10 rankings |
| Server → All | `online_count` | Number of currently connected users |
| Server → All | `contested_zone` | `x, y, width, height, endsAt` or `{ active: false }` |


