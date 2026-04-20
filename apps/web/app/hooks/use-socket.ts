import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import env from '~/env';

interface UseSocketOptions {
  /** JWT access token (for authenticated users) */
  token?: string | null;
  /** Guest token stored in localStorage */
  guestToken?: string | null;
  /** Whether to connect immediately */
  enabled?: boolean;
}

/**
 * Creates and manages a Socket.io connection to a given namespace.
 * The socket connects on mount (when enabled=true) and disconnects on unmount.
 */
export function useSocket(
  namespace: string,
  options: UseSocketOptions = {},
): Socket | null {
  const { token, guestToken, enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(`${env.VITE_WS_URL}${namespace}`, {
      auth: {
        ...(token ? { token } : {}),
        ...(guestToken ? { guestToken } : {}),
      },
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Re-connect only if namespace, token, or guestToken changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, token, guestToken, enabled]);

  return socketRef.current;
}
