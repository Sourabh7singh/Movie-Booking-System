import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "../services/socket";

/**
 * Core socket hook.
 * Returns the socket instance plus a "connected" flag.
 * Re-creates the socket if the token changes (login/logout).
 */
export function useSocket(token) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const s = getSocket(token);
    socketRef.current = s;

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    // Already connected
    if (s.connected) setConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, [token]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, connected, emit, on };
}
