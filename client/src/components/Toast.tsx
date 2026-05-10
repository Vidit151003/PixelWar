import React from 'react';
import { useGridStore } from '../store/gridStore';
import type { Toast } from '../types';

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useGridStore((s) => s.dismissToast);

  const icons = {
    stolen: '🔥',
    ranked: '🎯',
    zone: '⚔',
    joined: '→',
    info: 'ℹ',
  };

  return (
    <div
      className={`toast ${toast.type} ${toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icons[toast.type]}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>
        {toast.message}
      </span>
      <button
        onClick={() => dismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 0,
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
          transition: 'color 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        ×
      </button>
    </div>
  );
}

export function ToastStack() {
  const toasts = useGridStore((s) => s.toasts);

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
