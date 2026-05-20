import { prisma } from "../config/db.js";
import { SeatLockService } from "../services/seatLock.service.js";
import { AppError } from "../utils/errors.js";

/**
 * POST /api/payments/intent
 * Returns a mock client secret. In production, swap this for Stripe's
 * paymentIntents.create() and return the real clientSecret.
 */
export async function createPaymentIntent(req, res, next) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) throw new AppError("bookingId is required", 400, "VALIDATION_ERROR");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { showing: { include: { movie: true } }, seats: true },
    });

    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    if (booking.userId !== req.user.sub) throw new AppError("Forbidden", 403, "FORBIDDEN");
    if (booking.status !== "PENDING") {
      throw new AppError(`Booking is ${booking.status}, cannot pay`, 400, "INVALID_STATUS");
    }

    if (new Date() > booking.expiresAt) {
      throw new AppError("Booking has expired. Please start over.", 410, "BOOKING_EXPIRED");
    }

    // Mock Stripe PaymentIntent — replace with real Stripe SDK call in production
    const mockClientSecret = `mock_pi_${booking.id}_secret_${Date.now()}`;

    res.json({
      success: true,
      data: {
        clientSecret: mockClientSecret,
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: "inr",
        movie: booking.showing.movie.title,
        seats: booking.seats.map((s) => s.seatLabel),
        expiresAt: booking.expiresAt,
        mock: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/webhook
 * Simulates Stripe's payment_intent.succeeded event.
 * Real Stripe: verify webhook signature, parse event type, then call confirmSeats.
 * Mock: pass { bookingId } in body and call confirmSeats directly.
 */
export async function paymentWebhook(req, res, next) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.json({ success: true, received: true }); // ignore malformed webhooks
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true },
    });

    if (!booking || booking.status !== "PENDING") {
      return res.json({ success: true, skipped: true });
    }

    const io = req.app.get("io");
    const seatLabels = booking.seats.map((s) => s.seatLabel);

    await SeatLockService.confirmSeats(bookingId, seatLabels, booking.showingId, io);

    res.json({ success: true, confirmed: true, bookingId });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/:bookingId/status
 */
export async function paymentStatus(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      select: { id: true, status: true, paidAt: true, totalAmount: true, userId: true },
    });

    if (!booking) throw new AppError("Booking not found", 404, "NOT_FOUND");
    if (booking.userId !== req.user.sub) throw new AppError("Forbidden", 403, "FORBIDDEN");

    res.json({ success: true, data: { status: booking.status, paidAt: booking.paidAt, totalAmount: booking.totalAmount } });
  } catch (err) {
    next(err);
  }
}
