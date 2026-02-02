const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const bookingController = require("../controllers/booking.controller");

router.get("/", isLoggedIn, bookingController.getBookings);
router.post("/", isLoggedIn, bookingController.createBooking);
router.post("/:id/cancel", isLoggedIn, bookingController.cancelBooking);
router.delete("/:id", isLoggedIn, bookingController.deleteBooking);

module.exports = router;
