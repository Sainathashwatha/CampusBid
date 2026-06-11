import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

 
const router = Router();

router.post("/register", register);
router.post("/login",    login);
router.post("/logout",   protect, logout);  // must be logged in to log out
router.get("/me",        protect, getMe);   // get current user's info

export default router;