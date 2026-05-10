import React, { useEffect, useRef, useState } from 'react';
import { useGridStore } from '../store/gridStore';

const TILE_STRIDE = 15;
const MINIMAP_SIZE = 120;
const PX_PER_TILE = MINIMAP_SIZE / 50; // 2.4

let renderTimeout: number | null = null;

export function Minimap({ containerRef }: { containerRef?: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const grid = useGridStore((s) => s.grid);
  const lastRenderRef = useRef(0);

  // Throttled render
  useEffect(() => {
    const now = Date.now();
    if (now - lastRenderRef.current < 500) {
      if (renderTimeout) clearTimeout(renderTimeout);
      renderTimeout = window.setTimeout(() => {
        lastRenderRef.current = Date.now();
        renderMinimap();
      }, 500);
      return;
    }
    lastRenderRef.current = now;
    renderMinimap();
  }, [grid]);

  function renderMinimap() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(MINIMAP_SIZE, MINIMAP_SIZE);
    const data = imageData.data;

    for (let ty = 0; ty < 50; ty++) {
      for (let tx = 0; tx < 50; tx++) {
        const idx = ty * 50 + tx;
        const packed = grid[idx];
        const r = (packed) & 0xff;
        const g = (packed >> 8) & 0xff;
        const b = (packed >> 16) & 0xff;

        const px = Math.floor(tx * PX_PER_TILE);
        const py = Math.floor(ty * PX_PER_TILE);
        const pw = Math.ceil(PX_PER_TILE);
        const ph = Math.ceil(PX_PER_TILE);

        for (let dy = 0; dy < ph; dy++) {
          for (let dx = 0; dx < pw; dx++) {
            const cx = px + dx;
            const cy = py + dy;
            if (cx >= MINIMAP_SIZE || cy >= MINIMAP_SIZE) continue;
            const pi = (cy * MINIMAP_SIZE + cx) * 4;
            data[pi] = r;
            data[pi + 1] = g;
            data[pi + 2] = b;
            data[pi + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / MINIMAP_SIZE;
    const my = (e.clientY - rect.top) / MINIMAP_SIZE;

    // Pan main canvas to this position
    if (containerRef?.current) {
      const container = containerRef.current;
      const targetX = mx * 50 * TILE_STRIDE;
      const targetY = my * 50 * TILE_STRIDE;
      // Trigger custom event for pan
      container.dispatchEvent(new CustomEvent('minimap-pan', {
        detail: { x: -targetX + container.clientWidth / 2, y: -targetY + container.clientHeight / 2 }
      }));
    }
  };

  return (
    <div className="minimap-container">
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        padding: '3px 6px',
        background: 'rgba(14,14,15,0.8)',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        zIndex: 1,
      }}>
        Map
      </div>
      <canvas
        ref={canvasRef}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          cursor: 'crosshair',
          marginTop: 14,
        }}
      />
    </div>
  );
}
