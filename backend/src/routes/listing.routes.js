import { Router } from "express";
import {
  createListing,
  getListings,
  getListing,
  getMyListings,
  deleteListing,
} from "../controllers/listingController.js";
import { protect } from "../middleware/auth.js";
import { uploadImages } from "../middleware/upload.js";

const router = Router();

router.get("/",       getListings);
router.get("/mine",   protect, getMyListings);
router.get("/:id",    getListing);

 
router.post("/",      protect, uploadImages, createListing);
router.delete("/:id", protect, deleteListing);



export default router;