import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let _socket = null;

export function getSocket(token) {
  if (_socket && _socket.connected) {
    // If the token matches (or both are empty), keep using the same socket
    if (_socket.auth?.token === token) return _socket;
    
    // Otherwise, user logged in/out, so we need a new socket
    _socket.disconnect();
    _socket = null;
  }

  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: token ? { token } : {},
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return _socket;
}

export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
