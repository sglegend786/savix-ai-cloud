import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Scheme from "../models/Scheme.js";
import User from "../models/User.js";
import { analyzeEligibility, chatWithAI, compareSchemesAI } from "../utils/geminiService.js";
import { parseVoiceIntent } from "../controllers/voiceController.js";

const router = express.Router();

// ==========================================
// AI ELIGIBILITY CHECK
// POST /api/ai/eligibility/:schemeId
// ==========================================
router.post("/eligibility/:schemeId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -notifications -fcmTokens -createdAt -updatedAt -__v");
    const scheme = await Scheme.findById(req.params.schemeId).select("-createdAt -updatedAt -__v -createdBy");

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found" });
    }

    const result = await analyzeEligibility(user, scheme);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "AI Analysis failed", error: error.message });
  }
});

// ==========================================
// AI CHATBOT
// POST /api/ai/chat
// ==========================================
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const user = await User.findById(req.user.id).select("name age gender state occupation annualIncome isStudent isFarmer isMinority");
    console.log(`[AI Chat] User requested language: ${language}`);
    const reply = await chatWithAI(message, user, language);
    
    res.status(200).json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: "Chat failed", error: error.message });
  }
});

// ==========================================
// AI SCHEME COMPARISON
// POST /api/ai/compare
// ==========================================
router.post("/compare", protect, async (req, res) => {
  try {
    const { schemeIds } = req.body;
    if (!schemeIds || !Array.isArray(schemeIds) || schemeIds.length < 2) {
      return res.status(400).json({ success: false, message: "Please provide at least 2 scheme IDs to compare." });
    }

    const schemes = await Scheme.find({ _id: { $in: schemeIds } }).select("name description category eligibility benefits minAge maxAge");
    
    if (schemes.length < 2) {
       return res.status(404).json({ success: false, message: "One or more schemes not found." });
    }

    const result = await compareSchemesAI(schemes);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Comparison failed", error: error.message });
  }
});
// ==========================================
// VOICE OS INTENT ENGINE
// POST /api/ai/intent
// ==========================================
router.post("/intent", protect, parseVoiceIntent);

export default router;
