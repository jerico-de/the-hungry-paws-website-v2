const express = require("express");
const router  = express.Router();
const c       = require("../controllers/guest.booking.controller");
const { requireAdmin } = require("../middleware/auth");

// Public — no auth needed
router.post("/",                  c.createGuestBooking);
router.post("/hotel",             c.createGuestHotelBooking);

// Admin only
router.get("/",                   requireAdmin, c.getGuestBookings);
router.put("/:id/approve",        requireAdmin, c.approveGuestBooking);
router.put("/:id/reject",         requireAdmin, c.rejectGuestBooking);
router.put("/:id/pending",        requireAdmin, c.revertGuestToPending);

module.exports = router;