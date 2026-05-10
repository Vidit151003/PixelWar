import { useRef, useEffect, useCallback } from 'react';
import { useGridStore } from '../store/gridStore';

const TILE_SIZE = 14;
const TILE_STRIDE = 15; // 14px tile + 1px gap

interface AnimationEntry {
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number;
}

interface UseGridRendererOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTileClick?: (x: number, y: number) => void;
  zoom: number;
  panX: number;
  panY: number;
  isDemoMode?: boolean;
  demoGrid?: Uint32Array;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function brighten(hex: string, amount = 0.15): string {
  const [r, g, b] = hexToRgb(hex);
  const nr = Math.min(255, r + Math.round(255 * amount));
  const ng = Math.min(255, g + Math.round(255 * amount));
  const nb = Math.min(255, b + Math.round(255 * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

export function useGridRenderer({
  canvasRef,
  onTileClick,
  zoom,
  panX,
  panY,
  isDemoMode = false,
  demoGrid,
}: UseGridRendererOptions) {
  const animationQueue = useRef<AnimationEntry[]>([]);
  const rafRef = useRef<number>(0);
  const hoveredTile = useRef<{ x: number; y: number } | null>(null);
  const lastRenderTime = useRef<number>(0);
  const gridRef = useRef<Uint32Array | null>(null);
  const tilesMetaRef = useRef<any[]>([]);
  const contestedZoneRef = useRef<any | null>(null);
  const sessionRef = useRef<any | null>(null);

  // Subscribe to store
  useEffect(() => {
    const unsub = useGridStore.subscribe((state) => {
      gridRef.current = isDemoMode && demoGrid ? demoGrid : state.grid;
      tilesMetaRef.current = state.tilesMeta;
      contestedZoneRef.current = state.contestedZone;
      sessionRef.current = state.session;
    });
    const state = useGridStore.getState();
    gridRef.current = isDemoMode && demoGrid ? demoGrid : state.grid;
    tilesMetaRef.current = state.tilesMeta;
    contestedZoneRef.current = state.contestedZone;
    sessionRef.current = state.session;
    return unsub;
  }, [isDemoMode, demoGrid]);

  // Update grid ref when demoGrid changes
  useEffect(() => {
    if (isDemoMode && demoGrid) {
      gridRef.current = demoGrid;
    }
  }, [isDemoMode, demoGrid]);

  const addAnimation = useCallback((x: number, y: number, color: string) => {
    animationQueue.current.push({ x, y, color, startTime: performance.now(), duration: 200 });
  }, []);

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grid = gridRef.current;
    if (!grid) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0e0e0f';
    ctx.fillRect(0, 0, W, H);

    // Draw base tiles using ImageData for performance
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;

    for (let ty = 0; ty < 50; ty++) {
      for (let tx = 0; tx < 50; tx++) {
        const idx = ty * 50 + tx;
        const packed = grid[idx];

        // Extract ABGR (little-endian)
        const r = (packed) & 0xff;
        const g = (packed >> 8) & 0xff;
        const b = (packed >> 16) & 0xff;

        const px = Math.floor(tx * TILE_STRIDE);
        const py = Math.floor(ty * TILE_STRIDE);

        for (let dy = 0; dy < TILE_SIZE; dy++) {
          for (let dx = 0; dx < TILE_SIZE; dx++) {
            const cx = px + dx;
            const cy = py + dy;
            if (cx >= W || cy >= H) continue;
            const pi = (cy * W + cx) * 4;
            data[pi] = r;
            data[pi + 1] = g;
            data[pi + 2] = b;
            data[pi + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const now = performance.now();

    // Draw contested zone border pulse
    const cz = contestedZoneRef.current;
    if (cz) {
      const t = (now % 1200) / 1200;
      const alpha = 0.4 + 0.4 * Math.sin(t * Math.PI * 2);
      ctx.strokeStyle = `rgba(245,158,11,${alpha})`;
      ctx.lineWidth = 2;
      for (let cy = cz.y; cy < cz.y + cz.height; cy++) {
        for (let cx = cz.x; cx < cz.x + cz.width; cx++) {
          ctx.strokeRect(
            cx * TILE_STRIDE + 0.5,
            cy * TILE_STRIDE + 0.5,
            TILE_SIZE - 1,
            TILE_SIZE - 1
          );
        }
      }
    }

    // Draw hover highlight
    const hov = hoveredTile.current;
    if (hov) {
      const meta = tilesMetaRef.current[hov.y * 50 + hov.x];
      const baseColor = meta?.color || '#1a1a1d';
      ctx.fillStyle = brighten(baseColor, 0.2);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(hov.x * TILE_STRIDE, hov.y * TILE_STRIDE, TILE_SIZE, TILE_SIZE);
      ctx.globalAlpha = 1;
    }

    // Draw username labels at zoom > 2
    if (zoom > 2) {
      ctx.font = '7px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let ty = 0; ty < 50; ty++) {
        for (let tx = 0; tx < 50; tx++) {
          const meta = tilesMetaRef.current[ty * 50 + tx];
          if (meta?.username) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.save();
            ctx.beginPath();
            ctx.rect(tx * TILE_STRIDE, ty * TILE_STRIDE, TILE_SIZE, TILE_SIZE);
            ctx.clip();
            ctx.fillText(
              meta.username.slice(0, 3),
              tx * TILE_STRIDE + TILE_SIZE / 2,
              ty * TILE_STRIDE + TILE_SIZE / 2
            );
            ctx.restore();
          }
        }
      }
    }

    // Draw animations
    const activeAnimations: AnimationEntry[] = [];
    for (const anim of animationQueue.current) {
      const t = Math.min((now - anim.startTime) / anim.duration, 1);
      if (t >= 1) continue;

      const scale = 1 + 0.3 * Math.sin(t * Math.PI);
      const cx = anim.x * TILE_STRIDE + TILE_SIZE / 2;
      const cy = anim.y * TILE_STRIDE + TILE_SIZE / 2;
      const tileW = TILE_SIZE * scale;
      const tileH = TILE_SIZE * scale;

      // Tile bounce
      ctx.fillStyle = anim.color;
      ctx.globalAlpha = 1;
      ctx.fillRect(cx - tileW / 2, cy - tileH / 2, tileW, tileH);

      // Ripple
      const rippleRadius = 8 + t * 14;
      ctx.beginPath();
      ctx.arc(cx, cy, rippleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = anim.color;
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      activeAnimations.push(anim);
    }
    animationQueue.current = activeAnimations;

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [zoom, canvasRef]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame]);

  // Mouse events
  const getTileFromEvent = useCallback((e: MouseEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / zoom;
    const rawY = (e.clientY - rect.top) / zoom;
    const tx = Math.floor(rawX / TILE_STRIDE);
    const ty = Math.floor(rawY / TILE_STRIDE);
    if (tx < 0 || tx >= 50 || ty < 0 || ty >= 50) return null;
    return { x: tx, y: ty };
  }, [zoom, canvasRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const tile = getTileFromEvent(e);
    hoveredTile.current = tile;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = tile ? 'crosshair' : 'default';
    }
  }, [getTileFromEvent, canvasRef]);

  const handleClick = useCallback((e: MouseEvent) => {
    const tile = getTileFromEvent(e);
    if (tile && onTileClick) {
      onTileClick(tile.x, tile.y);
    }
  }, [getTileFromEvent, onTileClick]);

  const handleMouseLeave = useCallback(() => {
    hoveredTile.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleClick, handleMouseLeave]);

  return { addAnimation };
}
