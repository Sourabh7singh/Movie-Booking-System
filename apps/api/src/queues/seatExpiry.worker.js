import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { SeatLockService } from "../services/seatLock.service.js";
import { logger } from "../utils/logger.js";

export function startSeatExpiryWorker(io) {
  const worker = new Worker(
    "seat-expiry",
    async (job) => {
      const { bookingId, userId, showingId, seatLabels } = job.data;
      await SeatLockService.expireSeats(bookingId, userId, showingId, seatLabels, io);
    },
    { connection: redisConnection }
  );

  worker.on("failed", (job, err) => {
    logger.error(`Seat expiry job failed for booking ${job?.data?.bookingId}`, err);
  });

  return worker;
}
