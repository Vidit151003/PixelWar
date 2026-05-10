import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useGridRenderer } from './useGridRenderer';
import { useGridStore } from '../store/gridStore';

const CANVAS_SIZE = 750; // 50 * 15
const TILE_STRIDE = 15;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

interface GridCanvasProps {
  onTileClick?: (x: number, y: number) => void;
  isDemoMode?: boolean;
  demoGrid?: Uint32Array;
}

export function GridCanvas({ onTileClick, isDemoMode = false, demoGrid }: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });

  const connectionStatus = useGridStore((s) => s.connectionStatus);

  const { addAnimation } = useGridRenderer({
    canvasRef,
    onTileClick,
    zoom,
    panX: pan.x,
    panY: pan.y,
    isDemoMode,
    demoGrid,
  });

  // Expose addAnimation globally for the game page to call
  useEffect(() => {
    (window as any).__gridAddAnimation = addAnimation;
  }, [addAnimation]);

  // Resize canvas to match container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
    });

    observer.observe(container);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
    }

    return () => observer.disconnect();
  }, []);

  // Zoom via mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pan via mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    panOrigin.current = { ...pan };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: '#0e0e0f',
        cursor: isPanning.current ? 'grabbing' : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={wrapperRef}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          willChange: 'transform',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ display: 'block', imageRendering: 'pixelated' }}
        />
      </div>

      {/* Reconnect overlay */}
      {connectionStatus !== 'connected' && !isDemoMode && (
        <div className="reconnect-overlay">
          <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {connectionStatus === 'reconnecting' ? 'Reconnecting to battle...' : 'Offline'}
          </p>
        </div>
      )}
    </div>
  );
}
