import Redis from "ioredis";
import "dotenv/config";

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

export const redisConnection = {
  host: new URL(process.env.REDIS_URL).hostname,
  port: Number(new URL(process.env.REDIS_URL).port || 6379),
  password: new URL(process.env.REDIS_URL).password || undefined
};
