import redis from "../config/redis.js";

 

export const rateLimiter = (maxRequests = 10, windowSeconds = 60) => {
  return async (req, res, next) => {
    const identifier = req.user?.userId || req.ip;

     
    const routePattern = req.route?.path || req.path;
    const endpoint = routePattern.replace(/\//g, "_");
    const key = `rate_limit:${identifier}:${endpoint}`;

    try {
      const count = await redis.incr(key);

      if (count === 1) {
        // First hit in this window — start the expiry clock
        await redis.expire(key, windowSeconds);
      }

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        const ttl = await redis.ttl(key);
        return res.status(429).json({
          success: false,
          message: `Too many requests. Try again in ${ttl} seconds.`,
          retryAfter: ttl,
        });
      }

      next();
    } catch (err) {
      // Redis down → fail open (don't block the request)
      console.error("Rate limiter error:", err.message);
      next();
    }
  };
};