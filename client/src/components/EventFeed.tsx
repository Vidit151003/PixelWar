import React, { useEffect, useRef } from 'react';
import { useGridStore } from '../store/gridStore';
import type { EventEntry } from '../types';

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 5) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function EventRow({ event }: { event: EventEntry }) {
  const [, forceUpdate] = React.useState(0);
  useEffect(() => {
    const iv = setInterval(() => forceUpdate((n) => n + 1), 10000);
    return () => clearInterval(iv);
  }, []);

  const renderMessage = () => {
    switch (event.type) {
      case 'claim':
        return (
          <>
            <span style={{ marginRight: 4 }}>⚡</span>
            <span style={{ color: event.color || 'var(--text-primary)', fontWeight: 600 }}>
              {event.username}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}claimed [{event.x},{event.y}]
            </span>
          </>
        );
      case 'steal':
        return (
          <>
            <span style={{ marginRight: 4 }}>🔥</span>
            <span style={{ color: event.color || 'var(--text-primary)', fontWeight: 600 }}>
              {event.username}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}stole [{event.x},{event.y}]{event.prevOwner ? ` from ${event.prevOwner}` : ''}
            </span>
          </>
        );
      case 'joined':
        return (
          <>
            <span style={{ marginRight: 4 }}>→</span>
            <span style={{ color: event.color || 'var(--accent-green)', fontWeight: 600 }}>
              {event.username}
            </span>
            <span style={{ color: 'var(--text-muted)' }}> joined</span>
          </>
        );
      case 'left':
        return (
          <>
            <span style={{ marginRight: 4 }}>←</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {event.username}
            </span>
            <span style={{ color: 'var(--text-muted)' }}> left</span>
          </>
        );
      case 'contested':
        return (
          <>
            <span style={{ marginRight: 4 }}>⚔</span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
              Contested zone active!
            </span>
          </>
        );
    }
  };

  return (
    <div className="event-entry" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {renderMessage()}
      </span>
      <span style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
        marginTop: 1,
      }}>
        {timeAgo(event.ts)}
      </span>
    </div>
  );
}

export function EventFeed() {
  const events = useGridStore((s) => s.events);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div>
      <div className="sidebar-section-header">Live Activity</div>
      <div
        ref={scrollRef}
        style={{
          maxHeight: 200,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {events.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
            Waiting for activity...
          </div>
        ) : (
          events.slice(0, 20).map((event) => (
            <EventRow key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
