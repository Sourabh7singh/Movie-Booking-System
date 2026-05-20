import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { registerSeatHandlers } from "../sockets/seat.handlers.js";
import { logger } from "../utils/logger.js";

export function initSocket(server, { corsOrigin } = {}) {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin ?? "*",
      credentials: true,
    },
  });

  // Socket.IO auth middleware — extract userId from JWT token in handshake.
  // Falls back to socket.id so guests can use the seat-map without logging in.
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      // Guest mode: use socket.id as an anonymous user identifier
      socket.data.userId = `guest:${socket.id}`;
      socket.data.userName = "Guest";
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.data.userId = payload.sub;
      socket.data.userName = payload.name;
    } catch {
      // Invalid token — fall back to guest
      socket.data.userId = `guest:${socket.id}`;
      socket.data.userName = "Guest";
    }
    next();
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} user=${socket.data.userId ?? "guest"}`);
    registerSeatHandlers(io, socket);

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
