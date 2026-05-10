import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

// ── In-Memory State ──────────────────────────────────────────────────────────

const GRID_SIZE = 50;
const COOLDOWN_MS = 1500;

interface TileState {
  owner: string | null;    // socket id / session id
  username: string | null;
  color: string | null;
  claimedAt: number | null;
}

interface SessionInfo {
  id: string;
  username: string;
  color: string;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  color: string;
  tileCount: number;
  rank: number;
}

// grid[y][x]
const grid: Record<string, TileState> = {};

// Initialize all 2500 tiles as unclaimed
for (let y = 0; y < GRID_SIZE; y++) {
  for (let x = 0; x < GRID_SIZE; x++) {
    grid[`${x}-${y}`] = { owner: null, username: null, color: null, claimedAt: null };
  }
}

// active sessions: id -> SessionInfo
const sessions = new Map<string, SessionInfo>();

// cooldowns: sessionId -> timestamp when cooldown expires
const cooldowns = new Map<string, number>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGridArray() {
  const tiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x}-${y}`;
      const t = grid[key];
      tiles.push({ x, y, owner: t.owner, username: t.username, color: t.color, claimedAt: t.claimedAt });
    }
  }
  return tiles;
}

function computeLeaderboard(): LeaderboardEntry[] {
  const counts = new Map<string, { username: string; color: string; count: number }>();

  for (const tile of Object.values(grid)) {
    if (!tile.owner) continue;
    const entry = counts.get(tile.owner);
    if (entry) {
      entry.count++;
    } else {
      counts.set(tile.owner, { username: tile.username!, color: tile.color!, count: 1 });
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, data], i) => ({
      id,
      username: data.username,
      color: data.color,
      tileCount: data.count,
      rank: i + 1,
    }));
}

// ── Express + Socket.IO Setup ─────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true, players: sessions.size });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  path: '/socket.io',
});

// ── Leaderboard broadcast (debounced) ─────────────────────────────────────────
let lbTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleLeaderboardUpdate() {
  if (lbTimer) return;
  lbTimer = setTimeout(() => {
    lbTimer = null;
    const rankings = computeLeaderboard();
    io.emit('leaderboard_update', { rankings });
  }, 500);
}

// ── Contested Zone ────────────────────────────────────────────────────────────
let contestedZone: { x: number; y: number; width: number; height: number; endsAt: number } | null = null;

function startContestedZone() {
  const x = Math.floor(Math.random() * 46);
  const y = Math.floor(Math.random() * 46);
  const endsAt = Date.now() + 90_000;
  contestedZone = { x, y, width: 5, height: 5, endsAt };
  io.emit('contested_zone', contestedZone);

  setTimeout(() => {
    contestedZone = null;
    io.emit('contested_zone', { active: false });
    setTimeout(startContestedZone, 10_000);
  }, 90_000);
}

// Start first contested zone after 30s
setTimeout(startContestedZone, 30_000);

// ── Socket.IO Events ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  let session: SessionInfo | null = null;

  // ── Join ──────────────────────────────────────────────────────────────────
  socket.on('join', (data: { username: string; color: string }) => {
    if (session) return; // already joined

    const username = String(data.username || '').trim().slice(0, 16);
    const color = String(data.color || '#3b82f6');

    if (!username) {
      socket.emit('join_error', { error: 'Username required' });
      return;
    }

    const id = uuidv4();
    session = { id, username, color };
    sessions.set(id, session);

    // Send init to the joining client
    const allUsers = Array.from(sessions.values());
    socket.emit('init', {
      you: session,
      grid: getGridArray(),
      users: allUsers,
      leaderboard: computeLeaderboard(),
      contestedZone,
      onlineCount: sessions.size,
    });

    // Broadcast to everyone else
    socket.broadcast.emit('user_joined', {
      id: session.id,
      username: session.username,
      color: session.color,
    });

    // Broadcast updated online count to all
    io.emit('online_count', { count: sessions.size });

    console.log(`✅ ${username} joined (${sessions.size} online)`);
  });

  // ── Claim Tile ────────────────────────────────────────────────────────────
  socket.on('claim_tile', (data: { x: number; y: number }) => {
    if (!session) return;

    const { x, y } = data;
    if (
      typeof x !== 'number' || typeof y !== 'number' ||
      x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE
    ) {
      socket.emit('tile_rejected', { x, y, reason: 'invalid_coords' });
      return;
    }

    // Check cooldown
    const cooldownExpiry = cooldowns.get(session.id) || 0;
    const now = Date.now();
    const remaining = cooldownExpiry - now;
    if (remaining > 0) {
      socket.emit('tile_rejected', { x, y, reason: 'cooldown' });
      socket.emit('cooldown_remaining', { ms: remaining });
      return;
    }

    // Apply cooldown
    cooldowns.set(session.id, now + COOLDOWN_MS);

    const key = `${x}-${y}`;
    const prevTile = grid[key];
    const prevOwner = prevTile.username;
    const prevOwnerId = prevTile.owner;

    // Update tile
    grid[key] = {
      owner: session.id,
      username: session.username,
      color: session.color,
      claimedAt: now,
    };

    // Broadcast the claimed tile to ALL clients
    io.emit('tile_claimed', {
      x,
      y,
      owner: session.id,
      username: session.username,
      color: session.color,
      timestamp: now,
      prevOwner,
      prevOwnerId,
    });

    scheduleLeaderboardUpdate();
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (!session) return;
    sessions.delete(session.id);
    cooldowns.delete(session.id);

    io.emit('user_left', { id: session.id });
    io.emit('online_count', { count: sessions.size });

    console.log(`👋 ${session.username} left (${sessions.size} online)`);
    session = null;

    scheduleLeaderboardUpdate();
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3001');

server.listen(PORT, () => {
  console.log(`🚀 GridWar server running on port ${PORT}`);
  console.log(`   Socket.IO ready at ws://localhost:${PORT}/socket.io`);
});
