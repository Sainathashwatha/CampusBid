import { Worker } from "bullmq";
import pool from "../config/mysql.js";
import redis, { redisPub } from "../config/redis.js";
import { emailQueue } from "../queues/emailQueue.js";

 

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

const closeAuction = async (job) => {
  const { listingId } = job.data;
  console.log(`\n🔔 Closing auction: ${listingId}`);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Read + lock + set to 'closing' atomically
    const [rows] = await conn.query(
      `SELECT listing_id, status, highest_bidder_id, current_price, seller_id
       FROM auction_state
       WHERE listing_id = ?
       FOR UPDATE`,
      [listingId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      console.log(`Listing ${listingId} not found — skipping`);
      return;
    }

    const state = rows[0];

    // Idempotency: already closed → skip safely (BullMQ retry protection)
    if (state.status === "ended" || state.status === "sold") {
      await conn.rollback();
      console.log(`Listing ${listingId} already closed — skipping`);
      return;
    }

    // Crash-safe checkpoint: if server dies now and BullMQ retries,
    // we'll see 'closing' and know we were mid-flight → resume safely
    await conn.query(
      "UPDATE auction_state SET status = 'closing' WHERE listing_id = ?",
      [listingId]
    );

    /*
      Who won? It's already in auction_state.highest_bidder_id.
      The bid controller kept this accurate on every bid via SELECT FOR UPDATE.
      We trust it completely — it IS the source of truth.

      We still JOIN users here to get name + email for notifications.
    */
    let winner = null;
    if (state.highest_bidder_id) {
      const [winnerRows] = await conn.query(
        `SELECT u.id, u.name, u.email
         FROM users u
         WHERE u.id = ?`,
        [state.highest_bidder_id]
      );
      winner = winnerRows[0] || null;

      // Also get the winning amount from bids table (the highest bid for this bidder)
      const [bidRows] = await conn.query(
        `SELECT amount FROM bids
         WHERE listing_id = ? AND bidder_id = ?
         ORDER BY amount DESC LIMIT 1`,
        [listingId, state.highest_bidder_id]
      );
      if (winner && bidRows[0]) {
        winner.amount = bidRows[0].amount;
      }
    }

    // Mark auction as ended — this single update is the close operation
    // No bids table updates needed at all
    await conn.query(
      "UPDATE auction_state SET status = 'ended' WHERE listing_id = ?",
      [listingId]
    );

    await conn.commit();

    // Clean up Redis cache
    await redis.del(`highest_bid:${listingId}`);

    // Broadcast to all browsers watching this listing
    await redisPub.publish(
      `auction:${listingId}`,
      JSON.stringify({
        type: "AUCTION_ENDED",
        listingId,
        winner: winner
          ? { name: winner.name, amount: winner.amount }
          : null,
      })
    );

    // Fetch seller for email
    const [sellerRows] = await pool.query(
      "SELECT name, email FROM users WHERE id = ?",
      [state.seller_id]
    );
    const seller = sellerRows[0];

    // Enqueue emails as separate jobs (failures don't affect auction close)
    if (winner) {
      await emailQueue.add("winner-email", {
        to: winner.email,
        role: "winner",
        listingId,
        amount: winner.amount,
        bidderName: winner.name,
      }, { attempts: 5, backoff: { type: "exponential", delay: 30000 } });
    }

    if (seller) {
      await emailQueue.add("seller-email", {
        to: seller.email,
        role: winner ? "seller" : "seller_no_bids",
        listingId,
        amount: winner?.amount,
        buyerName: winner?.name,
        sellerName: seller.name,
      }, { attempts: 5, backoff: { type: "exponential", delay: 30000 } });
    }

    console.log(`✅ Auction ${listingId} closed. Winner: ${winner?.name || "none"}`);
  } catch (err) {
    await conn.rollback();
    console.error(`❌ Auction close failed for ${listingId}:`, err.message);
    throw err; // re-throw → BullMQ retries
  } finally {
    conn.release();
  }
};

export const startAuctionWorker = () => {
  const worker = new Worker("auction-close", closeAuction, {
    connection,
    concurrency: 5,
  });

  worker.on("completed", (job) => console.log(`✅ Job ${job.id} done`));
  worker.on("failed", (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));

  console.log("🚀 Auction worker started");
  return worker;
};