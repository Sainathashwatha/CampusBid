import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectMySQL } from "./src/config/mysql.js";
import { connectMongo } from "./src/config/mongo.js";
import { createTables } from "./src/models/mysql/schema.js";
import { verifyEmailConfig } from "./src/utils/email.js";

import authRoutes    from "./src/routes/auth.routes.js";
import listingRoutes from "./src/routes/listing.routes.js";
import bidRoutes     from "./src/routes/bid.routes.js";

import { initSocket }        from "./src/socket/index.js";
import { startAuctionWorker } from "./src/workers/auctionWorker.js";
import { startEmailWorker }   from "./src/queues/emailQueue.js";

const app    = express();
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true, // required for cookies to be sent cross-origin
}));
app.use(cookieParser());               // parse cookies from every request
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/bids",     bidRoutes);

app.get("/health", (_, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? err.message : "Server error",
  });
});

// ── Start ─────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectMySQL();
    await createTables();
    await connectMongo();
    await verifyEmailConfig();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`\n🚀 Server → http://localhost:${PORT}`);
    });

    initSocket(server);
    startAuctionWorker();
    startEmailWorker();
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
};

start();