// src/routes/feedback.routes.js
const express = require("express");
const router  = express.Router();
const {
  createFeedback,
  getFeatured,
  getAllFeedback,
  toggleFeatured,
  deleteFeedback,
} = require("../controllers/feedback.controller");

const { requireAdmin } = require("../middleware/auth");

// ── Public ──────────────────────────────────────────
// POST /api/feedback           — submit a review (any visitor)
router.post("/",        createFeedback);

// GET  /api/feedback/featured  — fetch featured reviews for homepage
router.get("/featured", getFeatured);

// ── Admin only ──────────────────────────────────────
// GET  /api/feedback/all              — view all reviews
router.get("/all",              requireAdmin, getAllFeedback);

// PUT  /api/feedback/:id/feature      — toggle featured flag
router.put("/:id/feature",      requireAdmin, toggleFeatured);

// DELETE /api/feedback/:id            — delete a review
router.delete("/:id",           requireAdmin, deleteFeedback);

module.exports = router;