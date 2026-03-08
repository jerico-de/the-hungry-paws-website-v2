const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const { requireAdmin } = require("../middleware/auth");

// Public route
router.post("/submit", contactController.submitContact);

// Admin routes
router.get("/", requireAdmin, contactController.getContacts);
router.get("/unread-count", requireAdmin, contactController.getUnreadCount);
router.put("/:id/read", requireAdmin, contactController.markAsRead);
router.delete("/:id", requireAdmin, contactController.deleteContact);

module.exports = router;
