const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { NotFoundError } = require("../utils/errors");

/**
 * Get all bookings (admin)
 */
async function getBookings(req, res, next) {
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
    next(err);
  }
}

/**
 * Approve booking
 */
async function approveBooking(req, res, next) {
  try {
    const adminId = req.user?.id || req.session.user.id;
    const db = getDB();

    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "approved",
          approvedBy: adminId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundError("Booking not found");
    }

    res.json({ success: true, message: "Booking approved!" });
  } catch (err) {
    next(err);
  }
}

/**
 * Reject booking
 */
async function rejectBooking(req, res, next) {
  try {
    const { reason } = req.body;
    const adminId = req.user?.id || req.session.user.id;
    const db = getDB();

    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: "rejected",
          rejectedBy: adminId,
          rejectReason: reason || "No reason provided",
          rejectedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundError("Booking not found");
    }

    res.json({ success: true, message: "Booking rejected!" });
  } catch (err) {
    next(err);
  }
}

/** 
 * Back to Pending
 */
async function revertToPending(req, res, next) {
  try {
    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: { status: "pending", updatedAt: new Date() },
        $unset: { approvedBy: "", approvedAt: "", rejectedBy: "", rejectReason: "", rejectedAt: "" },
      }
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success: true, message: "Booking reverted to pending." });
  } catch (err) { next(err); }
}

module.exports = { getBookings, approveBooking, rejectBooking, revertToPending };
