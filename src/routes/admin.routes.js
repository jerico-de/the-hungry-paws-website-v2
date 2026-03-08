const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");

router.get("/bookings", requireAdmin, adminController.getBookings);
router.put("/bookings/:id/approve", requireAdmin, adminController.approveBooking);
router.put("/bookings/:id/reject", requireAdmin, adminController.rejectBooking);

module.exports = router;
