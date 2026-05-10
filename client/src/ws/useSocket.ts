import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGridStore } from '../store/gridStore';
import type { SessionInfo } from '../types';

const BATCH_INTERVAL = 16; // ~1 rAF frame

let messageQueue: any[] = [];
let batchTimer: number | null = null;

export function useSocket(session: { username: string; color: string } | null) {
  const socketRef = useRef<Socket | null>(null);
  const isMounted = useRef(true);

  const flushMessages = useCallback((msgs: any[]) => {
    const store = useGridStore.getState();

    for (const msg of msgs) {
      switch (msg.type) {
        case 'init': {
          store.initGrid(msg.grid, msg.users);
          if (msg.you) store.setSession(msg.you as SessionInfo);
          if (msg.contestedZone) store.setContestedZone(msg.contestedZone);
          if (msg.leaderboard) store.setLeaderboard(msg.leaderboard);
          if (msg.onlineCount !== undefined) store.setOnlineCount(msg.onlineCount);
          break;
        }
        case 'tile_claimed': {
          const prevOwnerId = msg.prevOwnerId || null;
          store.claimTile(
            {
              x: msg.x, y: msg.y,
              owner: msg.owner, username: msg.username,
              color: msg.color, claimedAt: msg.timestamp,
            },
            prevOwnerId
          );

          const isSteal = prevOwnerId && prevOwnerId !== msg.owner;
          store.addEvent({
            type: isSteal ? 'steal' : 'claim',
            username: msg.username,
            color: msg.color,
            x: msg.x,
            y: msg.y,
            prevOwner: msg.prevOwner || undefined,
            ts: msg.timestamp || Date.now(),
          });

          // Toast if your tile was stolen
          const currentSession = store.session;
          if (isSteal && prevOwnerId === currentSession?.id) {
            store.addToast({
              type: 'stolen',
              message: `🔥 ${msg.username} stole your tile [${msg.x},${msg.y}]!`,
            });
          }
          break;
        }
        case 'tile_rejected': {
          break;
        }
        case 'cooldown_remaining': {
          store.setCooldown(Date.now() + msg.ms);
          break;
        }
        case 'user_joined': {
          store.addUser({ id: msg.id, username: msg.username, color: msg.color });
          store.addEvent({ type: 'joined', username: msg.username, color: msg.color, ts: Date.now() });
          store.addToast({ type: 'joined', message: `→ ${msg.username} joined the battle` });
          break;
        }
        case 'user_left': {
          const users = store.users;
          const user = users.get(msg.id);
          store.removeUser(msg.id);
          if (user) {
            store.addEvent({ type: 'left', username: user.username, color: user.color, ts: Date.now() });
          }
          break;
        }
        case 'leaderboard_update': {
          const curSession = store.session;
          if (curSession) {
            const prevRank = store.leaderboard.find((e) => e.id === curSession.id)?.rank;
            const newRank = msg.rankings.find((e: any) => e.id === curSession.id)?.rank;
            if (prevRank && newRank && newRank < prevRank) {
              store.addToast({
                type: 'ranked',
                message: `🎯 You're now #${newRank} on the leaderboard!`,
              });
            }
          }
          store.setLeaderboard(msg.rankings);
          break;
        }
        case 'contested_zone': {
          if (msg.active === false) {
            store.setContestedZone(null);
          } else {
            store.setContestedZone({ x: msg.x, y: msg.y, width: msg.width, height: msg.height, endsAt: msg.endsAt });
            store.addEvent({ type: 'contested', ts: Date.now() });
            store.addToast({ type: 'zone', message: '⚔ Contested zone is now active!' });
          }
          break;
        }
        case 'online_count': {
          store.setOnlineCount(msg.count);
          break;
        }
      }
    }
  }, []);

  const enqueue = useCallback((msg: any) => {
    messageQueue.push(msg);
    if (!batchTimer) {
      batchTimer = window.setTimeout(() => {
        const msgs = [...messageQueue];
        messageQueue = [];
        batchTimer = null;
        flushMessages(msgs);
      }, BATCH_INTERVAL);
    }
  }, [flushMessages]);

  useEffect(() => {
    isMounted.current = true;
    if (!session) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

    const socket = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (!isMounted.current) return;
      console.log('✅ Socket connected:', socket.id);
      useGridStore.getState().setConnectionStatus('connected');

      // Join the game
      socket.emit('join', { username: session.username, color: session.color });
    });

    socket.on('disconnect', () => {
      if (!isMounted.current) return;
      useGridStore.getState().setConnectionStatus('reconnecting');
    });

    socket.on('connect_error', () => {
      if (!isMounted.current) return;
      useGridStore.getState().setConnectionStatus('reconnecting');
    });

    // Register all game events
    const events = [
      'init', 'tile_claimed', 'tile_rejected', 'cooldown_remaining',
      'user_joined', 'user_left', 'leaderboard_update', 'contested_zone', 'online_count'
    ] as const;

    for (const event of events) {
      socket.on(event, (data: any) => enqueue({ type: event, ...data }));
    }

    return () => {
      isMounted.current = false;
      if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
      messageQueue = [];
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session, enqueue]);

  const sendClaim = useCallback((x: number, y: number) => {
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('claim_tile', { x, y });
      // Optimistic cooldown
      useGridStore.getState().setCooldown(Date.now() + 1500);
    }
  }, []);

  return { sendClaim };
}
