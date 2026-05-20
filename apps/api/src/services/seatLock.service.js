import { redis } from "../config/redis.js";
import { prisma } from "../config/db.js";
import { seatExpiryQueue } from "../queues/seatExpiry.queue.js";
import { logger } from "../utils/logger.js";

const TTL_SECONDS = Number(process.env.SEAT_LOCK_TTL_SECONDS || 180);

function lockKey(showingId, seatLabel) {
  return `seat:lock:${showingId}:${seatLabel}`;
}

function userLocksKey(userId, showingId) {
  return `user:locks:${userId}:${showingId}`;
}

export const SeatLockService = {
  async lockSeats(userId, showingId, seatLabels, bookingId, io) {
    const keys = seatLabels.map((seatLabel) => lockKey(showingId, seatLabel));

    const script = `
      local userId = ARGV[1]
      local bookingId = ARGV[2]
      local ttl = tonumber(ARGV[3])

      for i = 1, #KEYS do
        local existing = redis.call('GET', KEYS[i])
        if existing then
          local data = cjson.decode(existing)
          if data.userId ~= userId then
            return {err = 'SEAT_ALREADY_LOCKED:' .. KEYS[i]}
          end
        end
      end

      for i = 1, #KEYS do
        redis.call('SET', KEYS[i], cjson.encode({userId=userId, bookingId=bookingId, lockedAt=redis.call('TIME')[1]}), 'EX', ttl)
      end
      return 'OK'
    `;

    await redis.eval(script, keys.length, ...keys, userId, bookingId, TTL_SECONDS);

    const multi = redis.multi();
    multi.sadd(userLocksKey(userId, showingId), ...seatLabels);
    multi.expire(userLocksKey(userId, showingId), TTL_SECONDS);
    await multi.exec();

    await seatExpiryQueue.add(
      "expire-seat-locks",
      { bookingId, userId, showingId, seatLabels },
      { delay: TTL_SECONDS * 1000, jobId: `booking-${bookingId}` }
    );

    if (io) {
      io.to(`showing:${showingId}`).emit("seats:locked", {
        seatLabels,
        lockedBy: userId,
        expiresAt: Date.now() + TTL_SECONDS * 1000
      });
    }

    return { success: true, expiresAt: Date.now() + TTL_SECONDS * 1000 };
  },

  async releaseSeats(userId, showingId, seatLabels, io) {
    const pipeline = redis.multi();
    for (const seatLabel of seatLabels) {
      pipeline.del(lockKey(showingId, seatLabel));
    }
    pipeline.srem(userLocksKey(userId, showingId), ...seatLabels);
    await pipeline.exec();

    if (io) {
      io.to(`showing:${showingId}`).emit("seats:released", { seatLabels });
    }

    return { success: true };
  },

  async confirmSeats(bookingId, seatLabels, showingId, io) {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED", paidAt: new Date() }
    });

    await prisma.seat.updateMany({
      where: {
        showingId,
        seatLabel: { in: seatLabels }
      },
      data: { status: "BOOKED" }
    });

    const pipeline = redis.multi();
    for (const seatLabel of seatLabels) {
      pipeline.del(lockKey(showingId, seatLabel));
    }
    await pipeline.exec();

    await seatExpiryQueue.remove(`booking-${bookingId}`).catch(() => {});

    if (io) {
      io.to(`showing:${showingId}`).emit("seats:booked", { seatLabels });
    }

    logger.info("Booking confirmed", booking.id);
    return booking;
  },

  async expireSeats(bookingId, userId, showingId, seatLabels, io) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.status === "CONFIRMED") return { skipped: true };

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "EXPIRED" }
    });

    const pipeline = redis.multi();
    for (const seatLabel of seatLabels) {
      pipeline.del(lockKey(showingId, seatLabel));
    }
    await pipeline.exec();

    if (io) {
      io.to(`showing:${showingId}`).emit("seats:released", { seatLabels });
    }

    return { success: true };
  }
};
