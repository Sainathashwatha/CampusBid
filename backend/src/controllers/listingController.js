
import Listing from "../models/mongo/Listing.js";
import pool from "../config/mysql.js";
import redis from "../config/redis.js";
import { scheduleAuctionClose } from "../queues/auctionQueue.js";

// ── CREATE LISTING ────────────────────────────────────────────────
export const createListing = async (req, res) => {
  let listing = null;

  try {
    const {
      title, description, category, condition,
      listing_type, starting_price, buy_now_price,
      auction_end_time, custom_fields,
    } = req.body;

    const images = req.cloudinaryUrls || [];

    listing = await Listing.create({
      seller_id: req.user.userId,
      title, description, category, condition,
      listing_type,
      starting_price: Number(starting_price),
      buy_now_price: buy_now_price ? Number(buy_now_price) : null,
      images,
      custom_fields: custom_fields ? JSON.parse(custom_fields) : {},
    });

    const endTime = listing_type === "auction" && auction_end_time
      ? new Date(auction_end_time)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO auction_state
         (listing_id, seller_id, current_price, status, end_time)
       VALUES (?, ?, ?, 'active', ?)`,
      [listing._id.toString(), req.user.userId, Number(starting_price), endTime]
    );

    if (listing_type === "auction" && auction_end_time) {
      await scheduleAuctionClose(listing._id.toString(), new Date(auction_end_time));
    }

    res.status(201).json({
      success: true,
      listing: { ...listing.toObject(), status: "active", current_price: Number(starting_price) },
    });
  } catch (err) {
    if (listing?._id) {
      await Listing.findByIdAndDelete(listing._id).catch(() => {});
    }
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error("Create listing error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET ALL LISTINGS ──────────────────────────────────────────────
export const getListings = async (req, res) => {
  try {
    const {
      category, listing_type, condition,
      search, sort = "newest",
      page = 1, limit = 12,
    } = req.query;

    const mongoFilter = {};
    if (category)     mongoFilter.category     = category;
    if (listing_type) mongoFilter.listing_type = listing_type;
    if (condition)    mongoFilter.condition    = condition;
    if (search)       mongoFilter.$text        = { $search: search };

    const sortMap = {
      newest:      { createdAt: -1 },
      oldest:      { createdAt: 1 },
      price_low:   { starting_price: 1 },
      price_high:  { starting_price: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      Listing.find(mongoFilter).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(Number(limit)),
      Listing.countDocuments(mongoFilter),
    ]);

    if (listings.length === 0) {
      return res.json({ success: true, listings: [], pagination: { total: 0, page: 1, pages: 0 } });
    }

    const listingIds = listings.map((l) => l._id.toString());
    const placeholders = listingIds.map(() => "?").join(",");
    const [states] = await pool.query(
      `SELECT listing_id, current_price, highest_bidder_id, status, end_time
       FROM auction_state WHERE listing_id IN (${placeholders})`,
      listingIds
    );

    const stateMap = {};
    states.forEach((s) => { stateMap[s.listing_id] = s; });

    const merged = listings.map((l) => ({
      ...l.toObject(),
      ...(stateMap[l._id.toString()] || {}),
    }));

    res.json({
      success: true,
      listings: merged,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get listings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET SINGLE LISTING ────────────────────────────────────────────
export const getListing = async (req, res) => {
  try {
    const { id } = req.params;

    
    const [listing, cachedBid, [stateRows]] = await Promise.all([
      Listing.findById(id),
      redis.get(`highest_bid:${id}`),     // ← Redis read (was missing before)
      pool.query(
        `SELECT a.*, u.name AS winner_name
         FROM auction_state a
         LEFT JOIN users u ON a.highest_bidder_id = u.id
         WHERE a.listing_id = ?`,
        [id]
      ),
    ]);

    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    const state = stateRows[0] || null;

    
    const liveData = cachedBid ? JSON.parse(cachedBid) : null;

    res.json({
      success: true,
      listing: {
        ...listing.toObject(),
        ...state,
        // If Redis has a value, use it — it's the most recent bid data
        current_price: liveData?.amount || state?.current_price,
        current_bidder_name: liveData?.bidderName || state?.winner_name,
      },
    });
  } catch (err) {
    console.error("Get listing error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET MY LISTINGS ────────────────────────────────────────────────
export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller_id: req.user.userId }).sort({ createdAt: -1 });

    if (listings.length === 0) return res.json({ success: true, listings: [] });

    const listingIds = listings.map((l) => l._id.toString());
    const placeholders = listingIds.map(() => "?").join(",");
    const [states] = await pool.query(
      `SELECT * FROM auction_state WHERE listing_id IN (${placeholders})`,
      listingIds
    );

    const stateMap = {};
    states.forEach((s) => { stateMap[s.listing_id] = s; });

    const merged = listings.map((l) => ({
      ...l.toObject(),
      ...(stateMap[l._id.toString()] || {}),
    }));

    res.json({ success: true, listings: merged });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── DELETE / CANCEL ────────────────────────────────────────────────
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: "Not found" });
    if (listing.seller_id !== req.user.userId)
      return res.status(403).json({ success: false, message: "Not authorized" });

    const [bids] = await pool.query(
      "SELECT id FROM bids WHERE listing_id=? LIMIT 1",
      [req.params.id]
    );

    if (bids.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a listing that has bids",
      });
    }

    await pool.query(
      "UPDATE auction_state SET status='cancelled' WHERE listing_id=?",
      [req.params.id]
    );

    res.json({ success: true, message: "Listing cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};