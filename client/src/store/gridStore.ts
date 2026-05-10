import { create } from 'zustand';
import type { TileObject, User, LeaderboardEntry, SessionInfo, EventEntry, Zone, Toast, ConnectionStatus } from '../types';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Pack color hex into Uint32 RGBA (little-endian canvas)
function hexToRGBA(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (255 << 24) | (b << 16) | (g << 8) | r; // ABGR for canvas
}

const UNCLAIMED_COLOR = 0xff1d1d1a; // #1a1a1d with full alpha

interface GridState {
  // Grid data
  grid: Uint32Array;
  tilesMeta: TileObject[];
  users: Map<string, User>;
  session: SessionInfo | null;
  tileCount: number;
  cooldownUntil: number;
  leaderboard: LeaderboardEntry[];
  prevLeaderboard: LeaderboardEntry[];
  events: EventEntry[];
  contestedZone: Zone | null;
  connectionStatus: ConnectionStatus;
  toasts: Toast[];
  onlineCount: number;

  // Actions
  setSession: (s: SessionInfo) => void;
  initGrid: (tiles: TileObject[], users: User[]) => void;
  claimTile: (tile: TileObject, prevOwnerId?: string | null) => void;
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
  setLeaderboard: (lb: LeaderboardEntry[]) => void;
  addEvent: (event: Omit<EventEntry, 'id'>) => void;
  setContestedZone: (zone: Zone | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setCooldown: (until: number) => void;
  addToast: (toast: Omit<Toast, 'id' | 'ts'>) => void;
  dismissToast: (id: string) => void;
  setTileCount: (count: number) => void;
  setOnlineCount: (count: number) => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: new Uint32Array(2500).fill(UNCLAIMED_COLOR),
  tilesMeta: Array.from({ length: 2500 }, (_, i) => ({
    x: i % 50,
    y: Math.floor(i / 50),
    owner: null,
    username: null,
    color: null,
    claimedAt: null,
  })),
  users: new Map(),
  session: null,
  tileCount: 0,
  cooldownUntil: 0,
  leaderboard: [],
  prevLeaderboard: [],
  events: [],
  contestedZone: null,
  connectionStatus: 'offline',
  toasts: [],
  onlineCount: 0,

  setSession: (s) => set({ session: s }),

  initGrid: (tiles, users) => {
    const grid = new Uint32Array(2500).fill(UNCLAIMED_COLOR);
    const tilesMeta: TileObject[] = Array.from({ length: 2500 }, (_, i) => ({
      x: i % 50,
      y: Math.floor(i / 50),
      owner: null,
      username: null,
      color: null,
      claimedAt: null,
    }));

    for (const tile of tiles) {
      const idx = tile.y * 50 + tile.x;
      if (idx >= 0 && idx < 2500) {
        tilesMeta[idx] = tile;
        if (tile.color) {
          grid[idx] = hexToRGBA(tile.color);
        }
      }
    }

    const userMap = new Map<string, User>();
    for (const u of users) {
      userMap.set(u.id, u);
    }

    const session = get().session;
    let tileCount = 0;
    if (session) {
      tileCount = tiles.filter((t) => t.owner === session.id).length;
    }

    set({ grid, tilesMeta, users: userMap, tileCount });
  },

  claimTile: (tile, prevOwnerId) => {
    const { grid, tilesMeta, session } = get();
    const idx = tile.y * 50 + tile.x;
    if (idx < 0 || idx >= 2500) return;

    const newGrid = new Uint32Array(grid);
    newGrid[idx] = tile.color ? hexToRGBA(tile.color) : UNCLAIMED_COLOR;

    const newMeta = [...tilesMeta];
    newMeta[idx] = tile;

    let tileCount = get().tileCount;
    if (session) {
      if (tile.owner === session.id) {
        tileCount++;
      } else if (prevOwnerId === session.id) {
        tileCount--;
      }
    }

    set({ grid: newGrid, tilesMeta: newMeta, tileCount: Math.max(0, tileCount) });
  },

  addUser: (user) => {
    const users = new Map(get().users);
    users.set(user.id, user);
    set({ users });
  },

  removeUser: (id) => {
    const users = new Map(get().users);
    users.delete(id);
    set({ users });
  },

  setLeaderboard: (lb) => {
    const prevLeaderboard = get().leaderboard;
    const newLb = lb.map((entry) => {
      const prev = prevLeaderboard.find((e) => e.id === entry.id);
      const sparkline = prev?.sparkline
        ? [...prev.sparkline.slice(-9), entry.tileCount]
        : [entry.tileCount];
      return { ...entry, sparkline };
    });
    set({ prevLeaderboard, leaderboard: newLb });
  },

  addEvent: (event) => {
    const events = [{ ...event, id: uuidv4() }, ...get().events].slice(0, 50);
    set({ events });
  },

  setContestedZone: (zone) => set({ contestedZone: zone }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setCooldown: (until) => set({ cooldownUntil: until }),
  setOnlineCount: (count) => set({ onlineCount: count }),

  addToast: (toast) => {
    const toasts = get().toasts;
    const newToast: Toast = { ...toast, id: uuidv4(), ts: Date.now() };
    const updated = [newToast, ...toasts].slice(0, 3);
    set({ toasts: updated });
    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((t) =>
          t.id === newToast.id ? { ...t, exiting: true } : t
        ),
      }));
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== newToast.id) }));
      }, 400);
    }, 3000);
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  setTileCount: (count) => set({ tileCount: count }),
}));
