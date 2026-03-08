const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const bookingController = require("../controllers/booking.controller");

router.get("/", requireAuth, bookingController.getBookings);
router.post("/", requireAuth, bookingController.createBooking);
router.post("/:id/cancel", requireAuth, bookingController.cancelBooking);
router.delete("/:id", requireAuth, bookingController.deleteBooking);

module.exports = router;
