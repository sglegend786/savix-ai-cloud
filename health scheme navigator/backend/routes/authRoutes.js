import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/me", protect, getMe);
router.get("/users", protect, adminOnly, getAllUsers);

export default router;
