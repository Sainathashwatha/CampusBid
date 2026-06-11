import mongoose from "mongoose";

 

const listingSchema = new mongoose.Schema(
  {
    // seller_id is a MySQL user ID (number), not a MongoDB ObjectId
    // We store it as Number so we can query: "show all listings by this seller"
    seller_id: {
      type: Number,
      required: [true, "Seller ID is required"],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,           // removes accidental leading/trailing spaces
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description too long"],
    },

    category: {
      type: String,
      required: true,
      // Only these values are valid — keeps data clean
      enum: ["electronics", "books", "clothing", "furniture", "sports", "other"],
    },

    // Array of Cloudinary URLs — a listing can have up to 5 photos
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 images allowed",
      },
    },

    condition: {
      type: String,
      required: true,
      enum: ["new", "like_new", "good", "fair"],
    },

    listing_type: {
      type: String,
      required: true,
      enum: ["auction", "fixed", "negotiable"],
      /*
        auction    → real-time bidding with a timer
        fixed      → set price, first to "buy" gets it
        negotiable → post price, interested buyers DM/chat
      */
    },

    starting_price: {
      type: Number,
      required: true,
      min: [1, "Starting price must be at least ₹1"],
    },

    // Optional: student can set a "buy it now" price
    // If someone pays this, auction closes immediately
    buy_now_price: {
      type: Number,
      default: null,
    },

  
    custom_fields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt fields
  }
);

 
listingSchema.index({ status: 1, createdAt: -1 });   // home page: active listings, newest first
listingSchema.index({ seller_id: 1 });                 // "my listings" page
listingSchema.index({ category: 1, status: 1 });       // filter by category
listingSchema.index({ title: "text", description: "text" }); // full-text search

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;