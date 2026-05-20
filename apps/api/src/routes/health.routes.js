import { Router } from "express";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({
      success: true,
      status: "ok",
      database: "up",
      redis: "up"
    });
  } catch (error) {
    next(error);
  }
});

export default router;
