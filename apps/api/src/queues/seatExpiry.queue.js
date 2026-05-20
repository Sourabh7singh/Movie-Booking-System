import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const seatExpiryQueue = new Queue("seat-expiry", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100
  }
});
