import { createClient, RedisClientType } from "redis";
import config from "@/config";

let redisClient: RedisClientType | null = null;
let isConnecting = false;

export const getRedisClient = async (): Promise<RedisClientType | null> => {
  // Return immediately if already connected
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // Prevent multiple parallel connect attempts
  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return getRedisClient();
  }

  isConnecting = true;

  try {
    redisClient = createClient({
      url: config.redisUrl,
      socket: {
        reconnectStrategy: retries => {
          if (retries > 10) {
            console.error("❌ Redis reconnect failed after 10 tries.");
            return new Error("Redis reconnect limit reached");
          }
          console.warn(`⚠️ Redis reconnecting... attempt ${retries}`);
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", err => {
      console.error("⚠️ Redis Client Error:", err.message);
    });

    redisClient.on("end", () => {
      console.warn("🔌 Redis connection closed, will try to reconnect...");
    });

    redisClient.on("reconnecting", () => {
      console.log("♻️ Redis reconnecting...");
    });

    await redisClient.connect();
    console.log("✅ Redis connected");
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
  } finally {
    isConnecting = false;
  }

  return redisClient;
};
