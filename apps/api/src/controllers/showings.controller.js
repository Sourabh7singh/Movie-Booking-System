import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import { AppError } from "../utils/errors.js";

/** Merge DB seat statuses with Redis lock state */
async function mergeSeatStatus(seats, showingId) {
  const lockKeys = seats.map((s) => `seat:lock:${showingId}:${s.seatLabel}`);
  const lockValues = lockKeys.length > 0 ? await redis.mget(...lockKeys) : [];

  return seats.map((seat, i) => {
    const lockRaw = lockValues[i];
    if (lockRaw) {
      const lock = JSON.parse(lockRaw);
      return { ...seat, lockStatus: "LOCKED", lockedBy: lock.userId, bookingId: lock.bookingId };
    }
    return { ...seat, lockStatus: seat.status === "BOOKED" ? "BOOKED" : "AVAILABLE" };
  });
}

export async function listShowings(req, res, next) {
  try {
    const { movieId, date } = req.query;

    const where = {};
    if (movieId) where.movieId = movieId;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.startsAt = { gte: start, lt: end };
    }

    const showings = await prisma.showing.findMany({
      where,
      include: {
        movie: { select: { id: true, title: true, duration: true, poster: true } },
        theater: { select: { id: true, name: true, rows: true, cols: true } },
        _count: { select: { seats: true, bookings: true } },
      },
      orderBy: { startsAt: "asc" },
    });

    res.json({ success: true, data: showings });
  } catch (err) {
    next(err);
  }
}

export async function getShowingById(req, res, next) {
  try {
    const showing = await prisma.showing.findUnique({
      where: { id: req.params.showingId },
      include: {
        movie: true,
        theater: true,
      },
    });

    if (!showing) throw new AppError("Showing not found", 404, "NOT_FOUND");
    res.json({ success: true, data: showing });
  } catch (err) {
    next(err);
  }
}

export async function getShowingSeats(req, res, next) {
  try {
    const { showingId } = req.params;

    const showing = await prisma.showing.findUnique({ where: { id: showingId } });
    if (!showing) throw new AppError("Showing not found", 404, "NOT_FOUND");

    const seats = await prisma.seat.findMany({
      where: { showingId },
      orderBy: [{ row: "asc" }, { col: "asc" }],
    });

    const merged = await mergeSeatStatus(seats, showingId);
    res.json({ success: true, data: merged });
  } catch (err) {
    next(err);
  }
}
