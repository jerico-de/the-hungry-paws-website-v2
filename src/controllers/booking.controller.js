const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { ValidationError, NotFoundError } = require("../utils/errors");

const ALL_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM",
];

/**
 * Parse a time slot string into today's Date for comparison.
 * e.g. "2:00 PM" on date "2025-06-10" → Date object
 */
function slotToDate(dateStr, timeStr) {
  const [time, meridiem] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const d = new Date(dateStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * GET /api/bookings/available-slots?date=YYYY-MM-DD&type=grooming
 * Returns time slots that are:
 *   1. At least 3 hours from now (if the date is today)
 *   2. Not already taken by an approved booking on that date
 */
async function getAvailableSlots(req, res, next) {
  try {
    const { date, type } = req.query;
    if (!date || !type) {
      return res.json({ success: true, slots: ALL_SLOTS });
    }

    const db = getDB();
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Find all approved bookings on this date for this type
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const approvedBookings = await db.collection("bookings").find({
      type,
      status: "approved",
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    }).toArray();

    const takenSlots = new Set(approvedBookings.map((b) => b.appointmentTime));

    const selectedDate = new Date(date);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === todayMidnight.getTime();

    const slots = ALL_SLOTS.map((slot) => {
      // Taken by an approved booking
      if (takenSlots.has(slot)) {
        return { time: slot, available: false, reason: "booked" };
      }
      // Too soon (today only)
      if (isToday) {
        const slotDate = slotToDate(date, slot);
        if (slotDate < threeHoursFromNow) {
          return { time: slot, available: false, reason: "too_soon" };
        }
      }
      return { time: slot, available: true };
    });

    res.json({ success: true, slots });
  } catch (err) {
    next(err);
  }
}

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
 * Create booking — with server-side slot validation
 */
async function createBooking(req, res, next) {
  try {
    const { pets, type, services, appointmentDate, appointmentTime, hotelCheckoutDate, hotelCheckoutTime, requestedGroomer } = req.body;
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

    // Server-side: enforce 3-hour advance booking for today
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const slotDateTime = slotToDate(appointmentDate, appointmentTime);

    const selectedDate = new Date(appointmentDate);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime() && slotDateTime < threeHoursFromNow) {
      throw new ValidationError("Bookings must be made at least 3 hours in advance.");
    }

    // Server-side: check if slot is already approved
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflict = await db.collection("bookings").findOne({
      type,
      status: "approved",
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime,
    });

    if (conflict) {
      throw new ValidationError("This time slot is already booked. Please choose another time.");
    }

    /* Resolve requested groomer name if provided */
    let requestedGroomerName = null;
    if (requestedGroomer) {
      const groomer = await db.collection("employees").findOne(
        { _id: new ObjectId(requestedGroomer), role: "Groomer", status: "active" },
        { projection: { name: 1 } }
      );
      requestedGroomerName = groomer?.name || null;
    }

    await db.collection("bookings").insertOne({
      userId: new ObjectId(userId),
      type,
      pets: pets.map((id) => new ObjectId(id)),
      services: services || null,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      hotelCheckoutDate: hotelCheckoutDate ? new Date(hotelCheckoutDate) : null,
      hotelCheckoutTime: hotelCheckoutTime || null,
      requestedGroomerId:   requestedGroomer     ? new ObjectId(requestedGroomer) : null,
      requestedGroomerName: requestedGroomerName,
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

module.exports = { getBookings, getAvailableSlots, createBooking, cancelBooking, deleteBooking, getActiveGroomers };

/* ─────────────────────────────────────────
   GET /api/bookings/groomers
   Returns active groomer employees for the booking form
   Only exposes name, role, shift — no sensitive data
───────────────────────────────────────── */
async function getActiveGroomers(req, res, next) {
  try {
    const db       = getDB();
    const groomers = await db.collection("employees")
      .find({ role: "Groomer", status: "active" })
      .project({ name: 1, role: 1, shift: 1 })
      .sort({ name: 1 })
      .toArray();
    res.json({ success: true, groomers });
  } catch (err) { next(err); }
}