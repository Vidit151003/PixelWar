import React from 'react';
import { useGridStore } from '../store/gridStore';

export function StatsSection() {
  const leaderboard = useGridStore((s) => s.leaderboard);
  const tilesMeta = useGridStore((s) => s.tilesMeta);
  const onlineCount = useGridStore((s) => s.onlineCount);
  const usersSize = useGridStore((s) => s.users.size);

  const totalClaimed = tilesMeta.filter((t) => t.owner !== null).length;
  const unclaimedPct = ((2500 - totalClaimed) / 2500 * 100).toFixed(1);

  // Territory bar segments
  const segments = leaderboard.slice(0, 5).map((entry) => ({
    id: entry.id,
    username: entry.username.slice(0, 10),
    color: entry.color,
    pct: (entry.tileCount / 2500 * 100),
    count: entry.tileCount,
  }));

  const topPctSum = segments.reduce((s, e) => s + e.pct, 0);
  const otherClaimed = totalClaimed - segments.reduce((s, e) => s + e.count, 0);
  const otherPct = (otherClaimed / 2500 * 100);

  return (
    <div>
      <div className="sidebar-section-header">Territory</div>

      {/* Territory bar */}
      <div style={{
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        marginBottom: 10,
        background: 'var(--bg-input)',
      }}>
        {segments.map((seg) => (
          <div
            key={seg.id}
            title={`${seg.username}: ${seg.pct.toFixed(1)}%`}
            style={{
              width: `${seg.pct}%`,
              background: seg.color,
              transition: 'width 500ms ease-out',
              flexShrink: 0,
            }}
          />
        ))}
        {otherPct > 0.1 && (
          <div
            title={`Others: ${otherPct.toFixed(1)}%`}
            style={{
              width: `${otherPct}%`,
              background: 'rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}
          />
        )}
        {/* Unclaimed = rest */}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 12 }}>
        {segments.slice(0, 3).map((seg) => (
          <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {seg.username} {seg.pct.toFixed(1)}%
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--bg-elevated)', border: '1px solid var(--border)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            unclaimed {unclaimedPct}%
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Claimed
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
            {totalClaimed.toLocaleString()}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}> / 2500</span>
          </div>
        </div>
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Players
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--accent-green)' }}>
            {onlineCount || usersSize}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}> online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
