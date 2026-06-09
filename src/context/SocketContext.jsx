'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

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

  // Reference to hold current auth state without causing re-renders
  const authRef = React.useRef(authState);
  useEffect(() => {
    authRef.current = authState;
  }, [authState]);

  // Main connection effect
  useEffect(() => {
    const isDashboard = typeof window !== 'undefined' && pathname &&
      (pathname.startsWith('/user') || pathname.startsWith('/admin'));

    // If we shouldn't connect, disconnect existing socket
    if (!isRequested && !isDashboard) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // If we already have a socket and we're just navigating within the dashboard, don't recreate it
    // Only recreate if the token/userId actually changed
    if (socket) {
      return;
    }

    const { token, userId } = authState;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

    if (!socketUrl) {
      console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined in environment!');
      return;
    }



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
      const currentUserId = authRef.current.userId;
      if (currentUserId) {
        socketInstance.emit('join_user', { userId: currentUserId });
      }
    });

    socketInstance.on('connect_error', (error) => {
      // Keep warnings for production debugging if needed, or remove completely. Let's remove it.
    });

    setSocket(socketInstance);

  }, [pathname, isRequested, authState.token, authState.userId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, requestSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
