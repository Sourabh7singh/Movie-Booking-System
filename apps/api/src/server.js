import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { initSocket } from "./config/socket.js";
import { startSeatExpiryWorker } from "./queues/seatExpiry.worker.js";
import { logger } from "./utils/logger.js";

const PORT = Number(process.env.PORT || 3000);
const app = createApp();
const server = http.createServer(app);
const io = initSocket(server, { corsOrigin: process.env.FRONTEND_URL });

// Make io available to controllers via req.app.get("io")
app.set("io", io);

startSeatExpiryWorker(io);

server.listen(PORT, () => {
  logger.info(`🎬 API listening on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close(() => process.exit(0));
});
