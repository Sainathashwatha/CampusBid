import pool from "../config/mysql.js";
import redis, { redisPub } from "../config/redis.js";

 

// ── PLACE BID ─────────────────────────────────────────────────────
export const placeBid = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const { listingId } = req.params;
    const { amount }    = req.body;
    const bidderId      = req.user.userId;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid bid amount" });
    }

    const bidAmount = Number(Number(amount).toFixed(2));

    await conn.beginTransaction();

    // SELECT FOR UPDATE — row-level lock, single source of truth validation
    const [rows] = await conn.query(
      `SELECT listing_id, seller_id, current_price,
              highest_bidder_id, status, end_time
       FROM auction_state
       WHERE listing_id = ?
       FOR UPDATE`,
      [listingId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    const state = rows[0];

    if (state.status !== "active") {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "This auction is not active" });
    }

    if (new Date() > new Date(state.end_time)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Auction has ended" });
    }

    if (state.seller_id === bidderId) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: "Cannot bid on your own listing" });
    }

    if (bidAmount <= state.current_price) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Bid must exceed current price of ₹${state.current_price}`,
      });
    }

    // ── Only 2 writes now (was 3) ─────────────────────────────────

    // 1. Update auction state — new price + new leader
    await conn.query(
      `UPDATE auction_state
       SET current_price = ?, highest_bidder_id = ?
       WHERE listing_id = ?`,
      [bidAmount, bidderId, listingId]
    );

    // 2. Insert bid — no status column, it's an immutable ledger entry
    const [result] = await conn.query(
      `INSERT INTO bids (listing_id, bidder_id, amount)
       VALUES (?, ?, ?)`,
      [listingId, bidderId, bidAmount]
    );

    await conn.commit();

    // ── Post-commit: cache + broadcast ───────────────────────────
    const [bidderRows] = await pool.query(
      "SELECT name FROM users WHERE id = ?",
      [bidderId]
    );
    const bidderName = bidderRows[0]?.name || "Someone";

    const secondsLeft = Math.max(
      0,
      Math.floor((new Date(state.end_time) - Date.now()) / 1000)
    );

    if (secondsLeft > 0) {
      await redis.setex(
        `highest_bid:${listingId}`,
        secondsLeft,
        JSON.stringify({ amount: bidAmount, bidderId, bidderName, timestamp: new Date().toISOString() })
      );
    }

    await redisPub.publish(
      `auction:${listingId}`,
      JSON.stringify({
        type: "NEW_BID",
        listingId,
        bidId: result.insertId,
        amount: bidAmount,
        bidderId,
        bidderName,
        timestamp: new Date().toISOString(),
      })
    );

    return res.status(201).json({
      success: true,
      message: "Bid placed!",
      bid: { id: result.insertId, amount: bidAmount, listingId },
    });
  } catch (err) {
    await conn.rollback();
    console.error("Bid error:", err);
    return res.status(500).json({ success: false, message: "Failed to place bid" });
  } finally {
    conn.release();
  }
};

 
export const getBidsForListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    const [bids] = await pool.query(
      `SELECT
         b.id,
         b.amount,
         b.created_at,
         u.name       AS bidder_name,
         u.avatar_url,
         CASE
           WHEN a.status = 'ended' AND b.bidder_id = a.highest_bidder_id THEN 'won'
           WHEN a.status != 'ended' AND b.bidder_id = a.highest_bidder_id THEN 'leading'
           ELSE 'outbid'
         END AS bid_status
       FROM bids b
       JOIN users u         ON b.bidder_id  = u.id
       JOIN auction_state a ON b.listing_id = a.listing_id
       WHERE b.listing_id = ?
       ORDER BY b.amount DESC`,
      [listingId]
    );

    res.json({ success: true, bids });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET MY BIDS ────────────────────────────────────────────────────
/*
  A student's full bid history with derived status.
  Shows every bid they placed and its outcome.
*/
export const getMyBids = async (req, res) => {
  try {
    const [bids] = await pool.query(
      `SELECT
         b.id,
         b.listing_id,
         b.amount,
         b.created_at,
         a.current_price,
         a.status        AS auction_status,
         a.end_time,
         CASE
           WHEN a.status = 'ended' AND b.bidder_id = a.highest_bidder_id THEN 'won'
           WHEN a.status != 'ended' AND b.bidder_id = a.highest_bidder_id THEN 'leading'
           ELSE 'outbid'
         END AS bid_status
       FROM bids b
       JOIN auction_state a ON b.listing_id = a.listing_id
       WHERE b.bidder_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );

    res.json({ success: true, bids });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};