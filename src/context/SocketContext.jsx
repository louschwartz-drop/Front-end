'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';
    let socketUrl = 'http://localhost:3002';
    let socketPath = '/socket.io';
    
    try {
      const urlObj = new URL(apiUrl);
      socketUrl = urlObj.origin;
      // Extract the path before /api/v1 (e.g. /dev)
      const pathPrefix = urlObj.pathname.split('/api/v1')[0];
      if (pathPrefix && pathPrefix !== '/') {
        socketPath = `${pathPrefix}/socket.io`.replace('//', '/');
      }
    } catch (e) {
      console.error('Invalid NEXT_PUBLIC_API_URL, using default socket URL');
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
