import { Server } from "socket.io";
import Redis from "ioredis";

 

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
    // pingTimeout: how long to wait before considering connection dead
    pingTimeout: 60000,
  });

  // ── Subscriber Redis client ──────────────────────────────
  // This client ONLY subscribes — it can't do GET/SET while subscribed
  const redisSub = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  // ── Listen for messages from bid controller ──────────────
  redisSub.on("message", (channel, message) => {
    /*
      channel = "auction:507f1f77bcf86cd799439011"
      message = JSON string with bid data or auction_ended event
    */
    try {
      const data = JSON.parse(message);
      const listingId = channel.split(":")[1];

      // Forward to all browsers in this listing's Socket.io room
      io.to(`listing:${listingId}`).emit(data.type, data);
      /*
        data.type is either:
          "NEW_BID"       → bid controller published this
          "AUCTION_ENDED" → auction worker published this
        
        React client listens for both and updates UI accordingly
      */
    } catch (err) {
      console.error("Socket message parse error:", err);
    }
  });

  // ── Handle browser connections ───────────────────────────
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    /*
      JOIN_AUCTION: browser tells us "I'm watching listing X"
      We put this socket into the room for that listing.
    */
    socket.on("JOIN_AUCTION", (listingId) => {
      socket.join(`listing:${listingId}`);

      // Subscribe to this listing's Redis channel (if not already)
      redisSub.subscribe(`auction:${listingId}`, (err) => {
        if (err) console.error("Redis subscribe error:", err);
      });

      console.log(`👁️  Socket ${socket.id} joined listing:${listingId}`);
    });

    /*
      LEAVE_AUCTION: browser navigates away from listing page
    */
    socket.on("LEAVE_AUCTION", (listingId) => {
      socket.leave(`listing:${listingId}`);
      console.log(`👋 Socket ${socket.id} left listing:${listingId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      // Socket.io auto-removes from all rooms on disconnect
    });
  });

  return io;
};