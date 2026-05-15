'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import userAuthStore from '@/store/userAuthStore';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context?.socket;
};

export const useSocketRequest = () => {
  const context = useContext(SocketContext);
  return context?.requestSocket;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [authState, setAuthState] = useState({ token: null, userId: null, isAuthenticated: false });
  const [isRequested, setIsRequested] = useState(false);

  // Function to explicitly request a socket connection (e.g. from ChatWidget)
  const requestSocket = useCallback(() => {
    setIsRequested(true);
  }, []);

  // Sync auth state from Zustand store
  useEffect(() => {
    const sync = () => {
      const state = userAuthStore.getState();
      const userId = state.user?._id || state.user?.id || null;
      setAuthState({ 
        token: state.token || null, 
        userId, 
        isAuthenticated: !!state.token 
      });
    };
    sync();
    return userAuthStore.subscribe(sync);
  }, []);

  useEffect(() => {
    const isDashboard = typeof window !== 'undefined' && 
      (window.location.pathname.startsWith('/user') || window.location.pathname.startsWith('/admin'));

    // Only connect if:
    // 1. A component specifically requested it (e.g. guest opening chat)
    // 2. OR the user is on a dashboard/admin page where real-time updates are essential
    if (!isRequested && !isDashboard) {
      if (socket) {
        console.log('🔌 Disconnecting socket (Not on dashboard and not requested)...');
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const { token, userId } = authState;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

    if (!socketUrl) {
      console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined in environment!');
      return;
    }

    console.log(`🔌 Socket init [${token ? 'Auth' : 'Guest Demand'}]`);

    const socketInstance = io(socketUrl, {
      path: socketPath,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      if (userId) {
        console.log(`👤 Joining personal room: user_${userId}`);
        socketInstance.emit('join_user', { userId });
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection attempt failed:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Disconnecting socket...');
      socketInstance.disconnect();
    };
  }, [authState.isAuthenticated, authState.token, authState.userId, isRequested]);

  return (
    <SocketContext.Provider value={{ socket, requestSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
