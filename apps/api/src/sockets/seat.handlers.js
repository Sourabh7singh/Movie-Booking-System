import { SeatLockService } from "../services/seatLock.service.js";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

/** Build a full seat snapshot merging DB status with Redis lock state */
async function buildSeatSnapshot(showingId, requestingUserId) {
  const seats = await prisma.seat.findMany({
    where: { showingId },
    orderBy: [{ row: "asc" }, { col: "asc" }],
  });

  if (seats.length === 0) return [];

  const lockKeys = seats.map((s) => `seat:lock:${showingId}:${s.seatLabel}`);
  const lockValues = await redis.mget(...lockKeys);

  return seats.map((seat, i) => {
    const lockRaw = lockValues[i];
    if (seat.status === "BOOKED") {
      return { ...seat, lockStatus: "BOOKED" };
    }
    if (lockRaw) {
      const lock = JSON.parse(lockRaw);
      const mine = lock.userId === requestingUserId;
      return {
        ...seat,
        lockStatus: mine ? "LOCKED_BY_ME" : "LOCKED_BY_OTHER",
        lockedBy: lock.userId,
        bookingId: lock.bookingId,
      };
    }
    return { ...seat, lockStatus: "AVAILABLE" };
  });
}

export function registerSeatHandlers(io, socket) {
  socket.on("join:showing", async ({ showingId }) => {
    socket.join(`showing:${showingId}`);
    try {
      const snapshot = await buildSeatSnapshot(showingId, socket.data.userId);
      socket.emit("seats:snapshot", { showingId, seats: snapshot, yourUserId: socket.data.userId });
    } catch (err) {
      logger.error("Error building seat snapshot", err);
      socket.emit("seats:snapshot", { showingId, seats: [] });
    }
  });

  socket.on("lock:seats", async ({ showingId, seatLabels, bookingId }) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.emit("seats:lock_failed", { seatLabels, reason: "Not connected — please refresh." });
      return;
    }

    try {
      await SeatLockService.lockSeats(userId, showingId, seatLabels, bookingId, io);
    } catch (error) {
      socket.emit("seats:lock_failed", {
        seatLabels,
        reason: error.message,
      });
    }
  });

  socket.on("release:seats", async ({ showingId, seatLabels }) => {
    const userId = socket.data.userId;
    if (!userId) return;
    await SeatLockService.releaseSeats(userId, showingId, seatLabels, io);
  });

  socket.on("disconnect", async () => {
    // Future: SeatLockService.releaseAllForUser(socket.data.userId, io)
  });
}
