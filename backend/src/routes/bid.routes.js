import { Router } from "express";
import { placeBid, getBidsForListing, getMyBids } from "../controllers/bidController.js";
import { protect } from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

 

router.get("/mine",         protect, getMyBids);
router.get("/:listingId",   getBidsForListing);
router.post("/:listingId",  protect, rateLimiter(2, 10), placeBid);

export default router;