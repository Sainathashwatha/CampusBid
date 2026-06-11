import Redis from "ioredis";

 

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // Automatically retry connection if Redis restarts
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000); // wait up to 2s between retries
    return delay;
  },
};

// Main Redis client — caching, sessions, rate limiting
const redis = new Redis(redisConfig);

// Publisher client — only used to publish bid events
export const redisPub = new Redis(redisConfig);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

 

export default redis;