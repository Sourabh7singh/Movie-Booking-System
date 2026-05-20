import { Router } from "express";
import { createBooking, getBookingById, cancelBooking } from "../controllers/bookings.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, createBooking);
router.get("/:bookingId", requireAuth, getBookingById);
router.delete("/:bookingId", requireAuth, cancelBooking);

export default router;
