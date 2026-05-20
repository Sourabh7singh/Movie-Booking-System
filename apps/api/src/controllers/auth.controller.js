import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/errors.js";

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      throw new AppError("email, password and name are required", 400, "VALIDATION_ERROR");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError("Email already in use", 409, "EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const accessToken = signAccess({ sub: user.id, email: user.email, name: user.name });
    const refreshToken = signRefresh({ sub: user.id });

    res.status(201).json({ success: true, data: { user, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError("email and password are required", 400, "VALIDATION_ERROR");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const accessToken = signAccess({ sub: user.id, email: user.email, name: user.name });
    const refreshToken = signRefresh({ sub: user.id });

    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, accessToken, refreshToken } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("refreshToken is required", 400, "VALIDATION_ERROR");

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401, "INVALID_TOKEN");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    const accessToken = signAccess({ sub: user.id, email: user.email, name: user.name });
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  // Stateless JWT — client drops tokens; add token blocklist here if needed
  res.json({ success: true, message: "Logged out" });
}
