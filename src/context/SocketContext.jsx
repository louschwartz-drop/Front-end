'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

    if (!socketUrl) {
      console.error('❌ NEXT_PUBLIC_SOCKET_URL is not defined in environment!');
      return;
    }

    console.log('🔌 Initializing socket with URL:', socketUrl, 'Path:', socketPath);

    const socketInstance = io(socketUrl, {
      path: socketPath,
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket.io server:', socketInstance.id);
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection attempt failed:', error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Sync user room when authenticated
  useEffect(() => {
    if (socket && typeof window !== 'undefined') {
      import('@/store/userAuthStore').then((mod) => {
        const user = mod.default.getState().user;
        const userId = user?._id || user?.id;
        if (userId) {
          console.log(`👤 Joining personal socket room: user_${userId}`);
          socket.emit('join_user', { userId });
        }
      });
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
