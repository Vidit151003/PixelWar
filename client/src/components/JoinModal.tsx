import React, { useState, useEffect } from 'react';

const NEON_COLORS = [
  '#00f5ff', // cyan
  '#bf00ff', // neon purple
  '#ff00aa', // hot pink
  '#00ff88', // neon green
  '#ff6600', // neon orange
  '#ffee00', // neon yellow
  '#0066ff', // electric blue
  '#ff0055', // neon red
  '#00ffcc', // aqua
  '#cc00ff', // violet
  '#ff3366', // rose
  '#33ff00', // lime
  '#ff9900', // amber
  '#0099ff', // sky blue
  '#ff00ff', // magenta
  '#00ffff', // aqua cyan
  '#ff6699', // salmon pink
  '#66ff33', // yellow-green
  '#3399ff', // dodger blue
  '#ff33cc', // orchid
];

interface JoinModalProps {
  onClose: () => void;
  onJoined: (username: string, color: string) => void;
}

export function JoinModal({ onClose, onJoined }: JoinModalProps) {
  const [username, setUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleJoin = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username is required');
      return;
    }
    if (trimmed.length > 16) {
      setError('Username must be 16 characters or less');
      return;
    }
    onJoined(trimmed, selectedColor);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #111113 0%, #0e0e0f 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
          animation: 'slide-in-up 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            fontSize: 28,
            marginBottom: 8,
            background: 'linear-gradient(135deg, #00f5ff, #bf00ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}>
            Enter The Grid
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Choose your identity and start claiming territory
          </p>
        </div>

        {/* Username input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 8,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value.slice(0, 16)); setError(''); }}
              placeholder="Enter your callsign..."
              maxLength={16}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${error ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                padding: '12px 44px 12px 14px',
                color: 'var(--text-primary)',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = selectedColor;
                e.target.style.boxShadow = `0 0 0 3px ${selectedColor}22`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <span style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              color: username.length >= 14 ? 'var(--accent-amber)' : 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
              pointerEvents: 'none',
            }}>
              {username.length}/16
            </span>
          </div>
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 28 }}>
          <label style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            Territory Color
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
          }}>
            {NEON_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                title={color}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: color,
                  border: selectedColor === color ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: selectedColor === color ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 150ms ease-out, border 150ms ease-out, box-shadow 150ms ease-out',
                  boxShadow: selectedColor === color
                    ? `0 0 16px ${color}cc, 0 0 32px ${color}44`
                    : `0 0 8px ${color}44`,
                  outline: 'none',
                }}
              />
            ))}
          </div>

          {/* Selected color preview */}
          <div style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            border: `1px solid ${selectedColor}33`,
          }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: selectedColor,
              boxShadow: `0 0 12px ${selectedColor}99`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Your color: <span style={{ color: selectedColor, fontWeight: 700, fontFamily: 'monospace' }}>{selectedColor}</span>
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8,
            color: 'var(--accent-red)',
            fontSize: 13,
            marginBottom: 18,
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            style={{
              flex: 2,
              padding: '12px',
              background: `linear-gradient(135deg, ${selectedColor}cc, ${selectedColor}88)`,
              border: `1px solid ${selectedColor}66`,
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              letterSpacing: '-0.01em',
              fontFamily: 'inherit',
              boxShadow: `0 0 20px ${selectedColor}44`,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 32px ${selectedColor}88`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 0 20px ${selectedColor}44`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ⚔ Enter The Grid
          </button>
        </div>
      </div>
    </div>
  );
}
