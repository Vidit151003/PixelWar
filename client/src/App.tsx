import React, { useState } from 'react';
import { LandingHero } from './components/LandingHero';
import { JoinModal } from './components/JoinModal';
import { GamePage } from './pages/GamePage';
import './index.css';

type AppState =
  | { view: 'landing' }
  | { view: 'joining' }
  | { view: 'game'; username: string; color: string };

export default function App() {
  const [state, setState] = useState<AppState>({ view: 'landing' });

  const handleJoined = (username: string, color: string) => {
    setState({ view: 'game', username, color });
  };

  if (state.view === 'game') {
    return <GamePage username={state.username} color={state.color} />;
  }

  return (
    <>
      <LandingHero onJoin={() => setState({ view: 'joining' })} />
      {state.view === 'joining' && (
        <JoinModal
          onClose={() => setState({ view: 'landing' })}
          onJoined={handleJoined}
        />
      )}
    </>
  );
}
