import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/mysql.js";
import redis from "../config/redis.js";

 

const COOKIE_OPTIONS = {
  httpOnly: true,                          // JS cannot access
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax",                         // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 days in milliseconds
};

const generateToken = (userId, email) =>
  jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ── REGISTER ──────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password min 6 characters" });

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?", [email.toLowerCase()]
    );
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: "Email already registered" });

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name.trim(), email.toLowerCase(), password_hash]
    );

    const token = generateToken(result.insertId, email);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      user: { id: result.insertId, name: name.trim(), email: email.toLowerCase() },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const [users] = await pool.query(
      "SELECT id, name, email, password_hash, avatar_url FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    // Vague error on purpose — don't confirm if email exists
    if (users.length === 0)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const token = generateToken(user.id, user.email);

    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    // Blacklist the token in Redis until it naturally expires
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.decode(token);
      const ttl = decoded?.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await redis.setex(`blacklist:${token}`, ttl, "1");
    }

    // Clear the cookie
    res.clearCookie("token", COOKIE_OPTIONS);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET CURRENT USER ───────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, avatar_url, is_verified, created_at FROM users WHERE id = ?",
      [req.user.userId]
    );
    if (!users.length)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};