const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");

/**
 * Get user bookings
 */
async function getBookings(req, res) {
  try {
    const type = req.query.type || "grooming";
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({
        userId: new ObjectId(req.session.user.id),
        type,
      })
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
    console.error("Get bookings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Create booking
 */
async function createBooking(req, res) {
  try {
    const { pets, type, services, antiRabiesDate, appointmentDate, appointmentTime, hotelCheckoutDate, hotelCheckoutTime } = req.body;

    if (!pets || !pets.length || !type || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (type === "grooming" && !antiRabiesDate) {
      return res.status(400).json({ success: false, message: "Anti-rabies date required for grooming" });
    }

    if (type === "grooming" && (!services || services.length === 0)) {
      return res.status(400).json({ success: false, message: "Please select at least one grooming service" });
    }

    if (type === "hotel" && (!hotelCheckoutDate || !hotelCheckoutTime)) {
      return res.status(400).json({ success: false, message: "Checkout date and time required for hotel" });
    }

    const db = getDB();
    await db.collection("bookings").insertOne({
      userId: new ObjectId(req.session.user.id),
      type,
      pets: pets.map((id) => new ObjectId(id)),
      services: services || null,
      antiRabiesDate: antiRabiesDate ? new Date(antiRabiesDate) : null,
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
    console.error("Create booking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Cancel booking
 */
async function cancelBooking(req, res) {
  try {
    const { reason } = req.body;

    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.session.user.id),
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
      return res.status(404).json({ success: false, message: "Booking not found or cannot be cancelled" });
    }

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Delete booking
 */
async function deleteBooking(req, res) {
  try {
    const db = getDB();
    const result = await db.collection("bookings").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.session.user.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getBookings,
  createBooking,
  cancelBooking,
  deleteBooking,
};
