import React, { useEffect, useState } from 'react';
import { useGridStore } from '../store/gridStore';
import { CooldownRing } from './CooldownRing';

export function HUD() {
  const session = useGridStore((s) => s.session);
  const tileCount = useGridStore((s) => s.tileCount);
  const connectionStatus = useGridStore((s) => s.connectionStatus);
  const contestedZone = useGridStore((s) => s.contestedZone);
  const [zoneTimer, setZoneTimer] = useState('');

  useEffect(() => {
    if (!contestedZone) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, contestedZone.endsAt - Date.now());
      const sec = Math.floor(remaining / 1000);
      setZoneTimer(`${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [contestedZone]);

  return (
    <div style={{
      height: 48,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Left: Brand + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          PixelWar
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`status-dot ${connectionStatus}`} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {connectionStatus === 'connected' ? 'Live' :
             connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Center: Contested zone badge */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {contestedZone && zoneTimer && (
          <div className="contested-badge">
            <span>⚔</span>
            <span>Zone active: {zoneTimer} remaining</span>
            <span style={{
              background: 'rgba(245,158,11,0.2)',
              borderRadius: 4,
              padding: '1px 6px',
              fontSize: 10,
            }}>3× score</span>
          </div>
        )}
      </div>

      {/* Right: User info */}
      {session && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          marginLeft: 'auto',
        }}>
          <CooldownRing />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: session.color,
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: `0 0 8px ${session.color}66`,
              flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {session.username}
              </span>
              <span style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.2,
              }}>
                {tileCount} tiles
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
