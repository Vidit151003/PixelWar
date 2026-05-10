import React, { useEffect, useRef, useState } from 'react';
import { GridCanvas } from '../canvas/GridCanvas';

// 20 predefined colors matching the spec
const BOT_COLORS = [
  '#db4040', '#db6e40', '#db9640', '#dbbe40',
  '#b8db40', '#90db40', '#68db40', '#40db58',
  '#40db80', '#40dba8', '#40d4db', '#40acdb',
  '#4084db', '#405cdb', '#5840db', '#8040db',
  '#aa40db', '#d240db', '#db4098', '#db4070',
];

const BOT_USERNAMES = [
  'Pixel', 'Storm', 'Nova', 'Blaze', 'Drift',
  'Frost', 'Gale', 'Haze', 'Ink', 'Jade',
  'Kite', 'Lux', 'Mist', 'Neon', 'Orb',
  'Pulse', 'Quest', 'Rune', 'Shade', 'Tide',
];

function hexToRGBAUint32(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (255 << 24) | (b << 16) | (g << 8) | r;
}

export function LandingHero({ onJoin }: { onJoin: () => void }) {
  const [playerCount, setPlayerCount] = useState(0);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'waking' | 'offline'>('checking');
  const demoGridRef = useRef(new Uint32Array(2500).fill(0xff1d1d1a));
  const [demoGrid, setDemoGrid] = useState<Uint32Array>(demoGridRef.current);

  // Fetch live player count & check server status
  useEffect(() => {
    const API_URL = import.meta.env.VITE_SERVER_URL || '';
    let isMounted = true;

    const fetchStats = async () => {
      // If it takes more than 1.5 seconds, assume it's a cold boot (Render free tier)
      const wakeTimeout = setTimeout(() => {
        if (isMounted && serverStatus !== 'online') {
          setServerStatus('waking');
        }
      }, 1500);

      try {
        const res = await fetch(`${API_URL}/health`);
        const data = await res.json();
        if (isMounted) {
          clearTimeout(wakeTimeout);
          setPlayerCount(data.players || 0);
          setServerStatus('online');
        }
      } catch {
        if (isMounted) {
          clearTimeout(wakeTimeout);
          // If the server is offline or still waking
          setServerStatus((prev) => prev === 'waking' ? 'waking' : 'offline');
        }
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Bot simulation: claim random tiles ~2 tiles/sec
  useEffect(() => {
    let botIndex = 0;
    const interval = setInterval(() => {
      const grid = new Uint32Array(demoGridRef.current);
      // Claim 2 tiles per tick
      for (let i = 0; i < 2; i++) {
        const x = Math.floor(Math.random() * 50);
        const y = Math.floor(Math.random() * 50);
        const idx = y * 50 + x;
        const color = BOT_COLORS[botIndex % BOT_COLORS.length];
        grid[idx] = hexToRGBAUint32(color);
        botIndex = (botIndex + 1) % BOT_COLORS.length;
      }
      demoGridRef.current = grid;
      setDemoGrid(new Uint32Array(grid));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0e0e0f',
    }}>
      {/* Animated grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
        <GridCanvas isDemoMode demoGrid={demoGrid} />
      </div>

      {/* CSS grid lines overlay */}
      <div className="grid-lines-bg" style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* Radial gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(14,14,15,0.75) 70%, rgba(14,14,15,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Center content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}>
        {/* Badge */}
        <div style={{
          background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 9999,
          padding: '6px 16px',
          fontSize: 12,
          fontWeight: 600,
          color: '#60a5fa',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Real-time Multiplayer
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(56px, 8vw, 96px)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textAlign: 'center',
          userSelect: 'none',
        }}>
          PixelWar
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(14px, 2vw, 18px)',
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          maxWidth: 400,
          lineHeight: 1.6,
        }}>
          A shared canvas. 2,500 tiles. Real-time chaos.
        </p>

        {/* Live player count / Server status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          {serverStatus === 'online' ? (
            <>
              <span className="status-dot connected" style={{ width: 8, height: 8 }} />
              <span className="tabular-nums">
                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{playerCount}</span>
                {' '}players online
              </span>
            </>
          ) : serverStatus === 'waking' ? (
            <>
              <span className="status-dot" style={{ width: 8, height: 8, background: 'var(--accent-amber)', animation: 'pulse 2s infinite' }} />
              <span>Waking up server... (this takes ~30s on free tier)</span>
            </>
          ) : (
            <>
              <span className="status-dot" style={{ width: 8, height: 8, background: 'var(--text-muted)' }} />
              <span>Connecting to grid...</span>
            </>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={onJoin}
          style={{
            marginTop: 8,
            padding: '14px 36px',
            fontSize: 15,
            fontWeight: 600,
            color: '#ffffff',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'all 150ms ease-out',
            boxShadow: '0 4px 24px rgba(59,130,246,0.4)',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(59,130,246,0.5)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 4px 24px rgba(59,130,246,0.4)';
          }}
        >
          Claim your territory →
        </button>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-muted)',
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {BOT_COLORS.slice(0, 5).map((c) => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            ))}
          </div>
          <span>Watch the bots fight below</span>
        </div>
      </div>
    </div>
  );
}
