import { Router } from "express";
import { createPaymentIntent, paymentWebhook, paymentStatus } from "../controllers/payments.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/intent", requireAuth, createPaymentIntent);
router.post("/webhook", paymentWebhook);
router.get("/:bookingId/status", requireAuth, paymentStatus);

export default router;
