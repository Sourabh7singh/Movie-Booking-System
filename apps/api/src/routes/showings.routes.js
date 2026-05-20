import { Router } from "express";
import { listShowings, getShowingById, getShowingSeats } from "../controllers/showings.controller.js";

const router = Router();

router.get("/", listShowings);
router.get("/:showingId", getShowingById);
router.get("/:showingId/seats", getShowingSeats);

export default router;
