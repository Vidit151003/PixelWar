import React from 'react';
import { Leaderboard } from './Leaderboard';
import { EventFeed } from './EventFeed';
import { StatsSection } from './StatsSection';

export function Sidebar() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '0 16px 16px',
      }}>
        <Leaderboard />
        <StatsSection />
        <EventFeed />
      </div>
    </div>
  );
}
