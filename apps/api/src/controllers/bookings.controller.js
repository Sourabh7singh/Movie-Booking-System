import { prisma } from "../config/db.js";
import { SeatLockService } from "../services/seatLock.service.js";
import { AppError } from "../utils/errors.js";

export async function createBooking(req, res, next) {
  try {
    const { showingId, seatLabels } = req.body;
    const userId = req.user.sub;

    if (!showingId || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      throw new AppError("showingId and seatLabels[] are required", 400, "VALIDATION_ERROR");
    }

    const showing = await prisma.showing.findUnique({ where: { id: showingId } });
    if (!showing) throw new AppError("Showing not found", 404, "NOT_FOUND");

    // Check seats exist and are available in DB
    const seats = await prisma.seat.findMany({
      where: { showingId, seatLabel: { in: seatLabels } },
    });

    if (seats.length !== seatLabels.length) {
      throw new AppError("One or more seat labels are invalid for this showing", 400, "INVALID_SEATS");
    }

    const alreadyBooked = seats.filter((s) => s.status === "BOOKED");
    if (alreadyBooked.length > 0) {
      throw new AppError(
        `Seats already booked: ${alreadyBooked.map((s) => s.seatLabel).join(", ")}`,
        409,
        "SEATS_ALREADY_BOOKED"
      );
    }

    const totalAmount = seats.length * showing.price;
    const expiresAt = new Date(Date.now() + 180_000); // 3 minutes

    const booking = await prisma.booking.create({
      data: {
        userId,
        showingId,
        totalAmount,
        expiresAt,
        status: "PENDING",
      },
      include: { showing: { include: { movie: true, theater: true } } },
    });

    // Lock seats in Redis (io is on req.app so we pass it)
    const io = req.app.get("io");
    await SeatLockService.lockSeats(userId, showingId, seatLabels, booking.id, io);

    res.status(201).json({ success: true, data: { booking, seatLabels } });
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: {
        seats: true,
        showing: { include: { movie: true, theater: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    if (booking.userId !== req.user.sub) throw new AppError("Forbidden", 403, "FORBIDDEN");

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { seats: true },
    });

    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    if (booking.userId !== req.user.sub) throw new AppError("Forbidden", 403, "FORBIDDEN");
    if (booking.status === "CONFIRMED") {
      throw new AppError("Cannot cancel a confirmed booking", 400, "ALREADY_CONFIRMED");
    }

    const io = req.app.get("io");
    const seatLabels = booking.seats.map((s) => s.seatLabel);

    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });

    if (seatLabels.length > 0) {
      await SeatLockService.releaseSeats(req.user.sub, booking.showingId, seatLabels, io);
    }

    res.json({ success: true, message: "Booking cancelled" });
  } catch (err) {
    next(err);
  }
}
