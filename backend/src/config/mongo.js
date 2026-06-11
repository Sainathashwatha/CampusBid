import mongoose from "mongoose";

 

export const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

// Mongoose fires this if it ever loses connection mid-run
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected — attempting reconnect...");
});

export default mongoose;