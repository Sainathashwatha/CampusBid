import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

 
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

// Multer config — memory storage, image files only, 5MB max per file
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG and WebP images are allowed"), false);
    }
  },
});

// Helper: upload a single buffer to Cloudinary via stream
const uploadToCloudinary = (buffer, folder = "auction-app") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 1000, height: 750, crop: "limit" }, // max dimensions
          { quality: "auto:good" },                     // auto-compress
          { fetch_format: "auto" },                     // serve WebP to modern browsers
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // HTTPS URL on Cloudinary CDN
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

 
export const uploadImages = [
  // Step 1: parse the multipart form
  multerUpload.array("images", 5),

  // Step 2: upload to Cloudinary
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        req.cloudinaryUrls = [];
        return next();
      }

      // Upload all files in parallel
      const urls = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer))
      );

      req.cloudinaryUrls = urls;
      next();
    } catch (err) {
      console.error("Cloudinary upload error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Image upload failed: " + err.message,
      });
    }
  },
];