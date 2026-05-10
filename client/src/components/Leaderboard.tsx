import React, { useEffect, useState } from 'react';
import { useGridStore } from '../store/gridStore';
import type { LeaderboardEntry } from '../types';

// Sparkline SVG
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 40;
  const H = 16;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

const RANK_BADGES = ['🥇', '🥈', '🥉'];

export function Leaderboard() {
  const leaderboard = useGridStore((s) => s.leaderboard);
  const prevLeaderboard = useGridStore((s) => s.prevLeaderboard);
  const users = useGridStore((s) => s.users);
  const [flashedRows, setFlashedRows] = useState<Set<string>>(new Set());

  // Flash rows whose rank changed
  useEffect(() => {
    if (!prevLeaderboard.length) return;
    const newFlash = new Set<string>();
    for (const entry of leaderboard) {
      const prev = prevLeaderboard.find((e) => e.id === entry.id);
      if (prev && prev.rank !== entry.rank) {
        newFlash.add(entry.id);
      }
    }
    if (newFlash.size > 0) {
      setFlashedRows(newFlash);
      setTimeout(() => setFlashedRows(new Set()), 600);
    }
  }, [leaderboard]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Leaderboard
        </span>
        <span style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          borderRadius: 9999,
          padding: '1px 7px',
          fontSize: 10,
          color: 'var(--text-secondary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {users.size} online
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {leaderboard.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
            No tiles claimed yet. Be first!
          </div>
        ) : (
          leaderboard.map((entry, i) => (
            <div
              key={entry.id}
              className={`lb-row ${flashedRows.has(entry.id) ? 'rank-changed' : ''}`}
              style={{ padding: '5px 6px' }}
            >
              {/* Rank */}
              <span style={{
                width: 20,
                fontSize: i < 3 ? 13 : 11,
                color: i < 3 ? undefined : 'var(--text-muted)',
                fontWeight: 600,
                textAlign: 'center',
                flexShrink: 0,
              }}>
                {i < 3 ? RANK_BADGES[i] : `${i + 1}.`}
              </span>

              {/* Color swatch */}
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: entry.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${entry.color}66`,
              }} />

              {/* Username */}
              <span style={{
                flex: 1,
                fontSize: 12,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 80,
              }}>
                {entry.username.slice(0, 12)}
              </span>

              {/* Sparkline */}
              {entry.sparkline && entry.sparkline.length >= 2 && (
                <Sparkline data={entry.sparkline} color={entry.color} />
              )}

              {/* Tile count */}
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
                marginLeft: 'auto',
                flexShrink: 0,
              }}>
                {entry.tileCount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
