import jwt from "jsonwebtoken";
import redis from "../config/redis.js";

export const protect = async (req, res, next) => {
  try {
    // Read from cookie first (browser requests), fall back to header (Postman)
    const token = req.cookies?.token
      || req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.status(401).json({ success: false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check blacklist (logout invalidation)
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted)
      return res.status(401).json({ success: false, message: "Session expired. Login again." });

    req.user = decoded; // { userId, email }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ success: false, message: "Session expired. Login again." });
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};