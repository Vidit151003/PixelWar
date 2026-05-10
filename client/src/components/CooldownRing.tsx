import React, { useEffect, useRef, useState } from 'react';
import { useGridStore } from '../store/gridStore';

export function CooldownRing() {
  const cooldownUntil = useGridStore((s) => s.cooldownUntil);
  const svgRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(true);
  const [pulsing, setPulsing] = useState(false);
  const prevReadyRef = useRef(true);

  const RADIUS = 12;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const remaining = cooldownUntil - now;
      const total = 1500;

      if (remaining <= 0) {
        if (svgRef.current) {
          svgRef.current.style.strokeDashoffset = '0';
        }
        if (!prevReadyRef.current) {
          // Just became ready
          setPulsing(true);
          setTimeout(() => setPulsing(false), 300);
          prevReadyRef.current = true;
        }
        setIsReady(true);
        return;
      }

      prevReadyRef.current = false;
      setIsReady(false);
      const progress = remaining / total; // 1 = full cooldown, 0 = ready
      const offset = CIRCUMFERENCE * (1 - progress);

      if (svgRef.current) {
        svgRef.current.style.strokeDashoffset = `${offset}`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cooldownUntil, CIRCUMFERENCE]);

  const ringColor = isReady ? 'var(--accent-green)' : 'var(--accent-blue)';

  return (
    <div
      title={isReady ? 'Ready to claim!' : 'Cooldown...'}
      style={{
        width: 32,
        height: 32,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width="32" height="32"
        viewBox="0 0 32 32"
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)',
          animation: pulsing ? 'ring-pulse 0.3s ease-out' : 'none',
        }}
      >
        {/* Background ring */}
        <circle
          cx="16" cy="16" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2.5"
        />
        {/* Progress ring */}
        <circle
          ref={svgRef}
          cx="16" cy="16" r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth="2.5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset="0"
          strokeLinecap="round"
          style={{ transition: 'stroke 300ms ease-out' }}
        />
      </svg>
      {/* Center icon */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: isReady ? 'var(--accent-green)' : 'rgba(255,255,255,0.2)',
        transition: 'background 300ms ease-out',
        boxShadow: isReady ? '0 0 6px var(--accent-green)' : 'none',
      }} />
    </div>
  );
}
