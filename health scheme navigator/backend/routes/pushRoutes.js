import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/push/subscribe
// Save browser push subscription for logged-in user
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ success: false, message: "No subscription provided" });
    }
    await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
    res.status(200).json({ success: true, message: "Push subscription saved" });
  } catch (err) {
    console.error("Push subscribe error:", err.message);
    res.status(500).json({ success: false, message: "Failed to save subscription" });
  }
});

// DELETE /api/push/unsubscribe
router.delete("/unsubscribe", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { pushSubscription: null });
    res.status(200).json({ success: true, message: "Unsubscribed from push" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to unsubscribe" });
  }
});

export default router;
