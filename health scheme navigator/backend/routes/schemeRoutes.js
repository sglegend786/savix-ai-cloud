import express from "express";

import {
  getAllSchemes,
  getSchemeById,
  getSchemesByCategory,
  getLatestSchemes,
  getNewSchemes,
  getActiveSchemes,
  createScheme,
} from "../controllers/schemeController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// SPECIFIC NAMED ROUTES FIRST
// (Must come before /:id to avoid collision)
// ==========================================

// GET /api/schemes/latest
router.get("/latest", getLatestSchemes);

// GET /api/schemes/new
router.get("/new", getNewSchemes);

// GET /api/schemes/active
router.get("/active", getActiveSchemes);

// GET /api/schemes/category/:category
router.get("/category/:category", getSchemesByCategory);

// POST /api/schemes (admin only)
router.post("/", protect, adminOnly, createScheme);

// ==========================================
// GENERAL ROUTES
// ==========================================

// GET /api/schemes
router.get("/", getAllSchemes);

// GET /api/schemes/:id
router.get("/:id", getSchemeById);

export default router;