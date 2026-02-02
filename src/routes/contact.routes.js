const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const { isAdmin } = require("../middleware/auth");

// Public route
router.post("/submit", contactController.submitContact);

// Admin routes
router.get("/", isAdmin, contactController.getContacts);
router.get("/unread-count", isAdmin, contactController.getUnreadCount);
router.put("/:id/read", isAdmin, contactController.markAsRead);
router.delete("/:id", isAdmin, contactController.deleteContact);

module.exports = router;
