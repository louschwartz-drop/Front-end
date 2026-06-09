'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import adminAuthStore from '@/store/adminAuthStore';

const AdminSocketContext = createContext(null);

/** Consume the authenticated /admin socket in any admin component. */
export const useAdminSocket = () => useContext(AdminSocketContext);

/**
 * AdminSocketProvider
 * Connects to the Socket.IO /admin namespace using the JWT token from
 * adminAuthStore. Uses Zustand's subscribe() API instead of the hook so
 * that hook call order stays stable across all renders.
 */
export function AdminSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Helper: (re)create the socket whenever the token changes
    function connect(token) {
      // Tear down any existing connection first
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }

      if (!token) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      const socketPath = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

      if (!socketUrl) {
        return;
      }

      const instance = io(`${socketUrl}/admin`, {
        path: socketPath,
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'], // Use websocket first
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      instance.on('connect', () => {
        
        // Re-join persistent rooms on every connection
        const admin = adminAuthStore.getState().admin;
        const adminId = admin?._id || admin?.id;
        if (adminId) {
          instance.emit('join_admin', { adminId });
        }
      });
      instance.on('connect_error', (err) =>
        {}
      );
      instance.on('disconnect', (reason) =>
        {}
      );

      socketRef.current = instance;
      setSocket(instance);
    }

    // Connect immediately with current token
    connect(adminAuthStore.getState().token);

    // Re-connect whenever the token changes (login / logout)
    const unsubscribe = adminAuthStore.subscribe((state, prevState) => {
      if (state.token !== prevState.token) {
        connect(state.token);
      }
    });

    return () => {
      unsubscribe();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // runs once on mount; token changes are handled via subscribe()

  return (
    <AdminSocketContext.Provider value={socket}>
      {children}
    </AdminSocketContext.Provider>
  );
}
