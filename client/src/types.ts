// Shared types for the frontend

export interface TileObject {
  x: number;
  y: number;
  owner: string | null;
  username: string | null;
  color: string | null;
  claimedAt: number | null;
}

export interface User {
  id: string;
  username: string;
  color: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  color: string;
  tileCount: number;
  rank: number;
  sparkline?: number[];
}

export interface SessionInfo {
  id: string;
  username: string;
  color: string;
}

export interface EventEntry {
  id: string;
  type: 'claim' | 'steal' | 'joined' | 'left' | 'contested';
  username?: string;
  color?: string;
  x?: number;
  y?: number;
  prevOwner?: string;
  ts: number;
}

export interface Zone {
  x: number;
  y: number;
  width: number;
  height: number;
  endsAt: number;
}

export interface Toast {
  id: string;
  type: 'stolen' | 'ranked' | 'zone' | 'joined' | 'info';
  message: string;
  ts: number;
  exiting?: boolean;
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline';
