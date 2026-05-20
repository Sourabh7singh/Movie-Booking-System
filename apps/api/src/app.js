import express from "express";
import cors from "cors";
import morgan from "morgan";
import { notFound, errorHandler } from "./middleware/error.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import showingsRoutes from "./routes/showings.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

export function createApp() {
  const app = express();

  // app.use(cors({ origin: process.env.FRONTEND_URL?.split(",") ?? "*", credentials: true }));
  app.use(cors({ origin: "*", credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/", (req, res) => {
    res.json({ success: true, message: "Movie booking API is running 🎬" });
  });

  app.use("/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/showings", showingsRoutes);
  app.use("/api/bookings", bookingsRoutes);
  app.use("/api/payments", paymentsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
