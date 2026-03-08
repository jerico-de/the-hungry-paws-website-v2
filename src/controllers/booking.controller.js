const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { ValidationError, NotFoundError } = require("../utils/errors");

/**
 * Get user bookings
 */
async function getBookings(req, res, next) {
  try {
    const type = req.query.type || "grooming";
    const userId = req.user?.id || req.session.user.id;
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({ userId: new ObjectId(userId), type })
      .sort({ createdAt: -1 })
      .toArray();

    const petsCol = db.collection("pets");
    const bookingsWithPets = await Promise.all(
      bookings.map(async (b) => {
        const pets = await petsCol.find({ _id: { $in: b.pets } }).toArray();
        return { ...b, pets };
      }),
    );

    res.json({ success: true, bookings: bookingsWithPets });
  } catch (err) {
    next(err);
  }
}

/**
 * Create booking
 */
async function createBooking(req, res, next) {
  try {
    const { pets, type, services, appointmentDate, appointmentTime, hotelCheckoutDate, hotelCheckoutTime } = req.body;
    const userId = req.user?.id || req.session.user.id;

    if (!pets || !pets.length || !type || !appointmentDate || !appointmentTime) {
      throw new ValidationError("Missing required fields");
    }

    if (type === "grooming" && (!services || services.length === 0)) {
      throw new ValidationError("Please select at least one grooming service");
    }

    if (type === "hotel" && (!hotelCheckoutDate || !hotelCheckoutTime)) {
      throw new ValidationError("Checkout date and time required for hotel booking");
    }

    const db = getDB();
    await db.collection("bookings").insertOne({
      userId: new ObjectId(userId),
      type,
      pets: pets.map((id) => new ObjectId(id)),
      services: services || null,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      hotelCheckoutDate: hotelCheckoutDate ? new Date(hotelCheckoutDate) : null,
      hotelCheckoutTime: hotelCheckoutTime || null,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Booking created successfully!" });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel booking
 */
async function cancelBooking(req, res, next) {
  try {
    const { reason } = req.body;
    const userId = req.user?.id || req.session.user.id;
    const db = getDB();

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(userId),
        status: { $in: ["pending", "approved"] },
      },
      {
        $set: {
          status: "cancelled",
          cancelReason: reason || "No reason provided",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundError("Booking not found or cannot be cancelled");
    }

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete booking
 */
async function deleteBooking(req, res, next) {
  try {
    const userId = req.user?.id || req.session.user.id;
    const db = getDB();

    const result = await db.collection("bookings").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Booking not found");
    }

    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBookings, createBooking, cancelBooking, deleteBooking };
