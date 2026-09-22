import express from "express";
import {
  broadcastNotification,
  getMyNotifications,
  markAllRead,
  getAllNotifications,
} from "../controllers/notificationController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin can broadcast a notification to all users
router.post("/broadcast", protect, adminOnly, broadcastNotification);

// Get personal notifications (any logged‑in user)
router.get("/my", protect, getMyNotifications);

// Mark all as read (any logged‑in user)
router.put("/mark-read", protect, markAllRead);

// Admin can view broadcast history
router.get("/all", protect, adminOnly, getAllNotifications);

export default router;
