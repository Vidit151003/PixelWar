import React, { useRef, useCallback } from 'react';
import { GridCanvas } from '../canvas/GridCanvas';
import { Sidebar } from '../components/Sidebar';
import { HUD } from '../components/HUD';
import { Minimap } from '../components/Minimap';
import { ToastStack } from '../components/Toast';
import { useSocket } from '../ws/useSocket';
import { useGridStore } from '../store/gridStore';

interface GamePageProps {
  username: string;
  color: string;
}

export function GamePage({ username, color }: GamePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { sendClaim } = useSocket({ username, color });

  const handleTileClick = useCallback((x: number, y: number) => {
    const store = useGridStore.getState();
    if (store.cooldownUntil > Date.now()) return;
    sendClaim(x, y);

    // Trigger canvas animation for claimed tile
    const tileColor = store.session?.color || color;
    if ((window as any).__gridAddAnimation) {
      (window as any).__gridAddAnimation(x, y, tileColor);
    }
  }, [sendClaim, color]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      <HUD />
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Main canvas area */}
        <div
          ref={containerRef}
          style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        >
          <GridCanvas onTileClick={handleTileClick} />
          <Minimap containerRef={containerRef} />
        </div>

        {/* Sidebar: ~280px */}
        <div style={{
          width: '25%',
          minWidth: 240,
          maxWidth: 320,
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <Sidebar />
        </div>
      </div>

      <ToastStack />
    </div>
  );
}
