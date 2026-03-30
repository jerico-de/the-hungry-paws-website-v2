// src/controllers/feedback.controller.js
const { getDB }    = require("../config/database");
const { ObjectId } = require("mongodb");
const { ValidationError, NotFoundError } = require("../utils/errors");

/* ─────────────────────────────────────────
   POST /api/feedback
   Public — anyone can submit feedback.
   If a session user is logged in their name/email are used automatically.
───────────────────────────────────────── */
async function createFeedback(req, res, next) {
  try {
    const { rating, comment, serviceType, anonymous } = req.body;
    let { name } = req.body;

    if (!rating || !comment) {
      throw new ValidationError("Rating and comment are required.");
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      throw new ValidationError("Rating must be between 1 and 5.");
    }

    if (comment.trim().length > 500) {
      throw new ValidationError("Comment too long (max 500 characters).");
    }

    // If user is logged in, prefer their stored name/email
    if (req.session?.user) {
      name = req.session.user.fullName || name || "Anonymous";
    }

    const db = getDB();

    const isAnonymous = !!anonymous;
    const displayName = isAnonymous ? "Anonymous" : (name?.trim() || "Anonymous");

    const result = await db.collection("feedbacks").insertOne({
      name:        displayName,
      realName:    name?.trim() || null,   // always stored internally even if anonymous
      email:       req.session?.user?.email || "",
      userId:      req.session?.user?._id ? new ObjectId(req.session.user._id) : null,
      rating:      Number(rating),
      comment:     comment.trim(),
      serviceType: serviceType || "General",
      anonymous:   isAnonymous,
      featured:    false,
      approved:    true,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });

    res.json({ success: true, message: "Thank you for your feedback!", id: result.insertedId });
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────
   GET /api/feedback/featured
   Public — returns up to 6 featured feedbacks for the homepage.
───────────────────────────────────────── */
async function getFeatured(req, res, next) {
  try {
    const db = getDB();

    const feedbacks = await db
      .collection("feedbacks")
      .find({ featured: true, approved: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .project({ name: 1, rating: 1, comment: 1, serviceType: 1, createdAt: 1 })
      .toArray();

    res.json({ success: true, feedbacks });
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────
   GET /api/feedback/all
   Admin only — returns all feedback entries sorted newest first.
───────────────────────────────────────── */
async function getAllFeedback(req, res, next) {
  try {
    const db = getDB();

    const feedbacks = await db
      .collection("feedbacks")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, feedbacks });
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────
   PUT /api/feedback/:id/feature
   Admin only — toggle featured flag on a feedback entry.
   Body: { featured: true | false }
───────────────────────────────────────── */
async function toggleFeatured(req, res, next) {
  try {
    const { featured } = req.body;
    const db = getDB();

    const result = await db.collection("feedbacks").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { featured: !!featured, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError("Feedback not found.");
    }

    res.json({
      success: true,
      message: featured ? "Marked as featured." : "Removed from featured.",
    });
  } catch (err) {
    next(err);
  }
}

/* ─────────────────────────────────────────
   DELETE /api/feedback/:id
   Admin only — permanently delete a feedback entry.
───────────────────────────────────────── */
async function deleteFeedback(req, res, next) {
  try {
    const db = getDB();

    const result = await db.collection("feedbacks").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Feedback not found.");
    }

    res.json({ success: true, message: "Feedback deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = { createFeedback, getFeatured, getAllFeedback, toggleFeatured, deleteFeedback };