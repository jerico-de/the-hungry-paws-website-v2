const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/auth");
const adminController = require("../controllers/admin.controller");

router.get("/bookings", isAdmin, adminController.getBookings);
router.put("/bookings/:id/approve", isAdmin, adminController.approveBooking);
router.put("/bookings/:id/reject", isAdmin, adminController.rejectBooking);

module.exports = router;
