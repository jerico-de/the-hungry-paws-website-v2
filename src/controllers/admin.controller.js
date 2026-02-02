const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");

/**
 * Get all bookings (admin)
 */
async function getBookings(req, res) {
  try {
    const type = req.query.type || "grooming";
    const status = req.query.status || "pending";
    const db = getDB();

    const bookings = await db.collection("bookings").find({ type, status }).sort({ createdAt: -1 }).toArray();

    const petsCol = db.collection("pets");
    const usersCol = db.collection("users");

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (b) => {
        const pets = await petsCol.find({ _id: { $in: b.pets } }).toArray();
        const user = await usersCol.findOne({ _id: b.userId });

        return {
          ...b,
          pets,
          userName: user ? user.fullName : "Unknown",
          userEmail: user ? user.email : "Unknown",
          userContact: user ? user.contact : "Unknown",
        };
      }),
    );

    res.json({ success: true, bookings: bookingsWithDetails });
  } catch (err) {
    console.error("Admin get bookings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Approve booking
 */
async function approveBooking(req, res) {
  try {
    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "approved",
          approvedBy: req.session.user.id,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking approved!" });
  } catch (err) {
    console.error("Approve booking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Reject booking
 */
async function rejectBooking(req, res) {
  try {
    const { reason } = req.body;

    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "rejected",
          rejectedBy: req.session.user.id,
          rejectReason: reason || "No reason provided",
          rejectedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking rejected!" });
  } catch (err) {
    console.error("Reject booking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getBookings,
  approveBooking,
  rejectBooking,
};
