const { ObjectId } = require("mongodb");
const { getDB }    = require("../config/database");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { sendGuestBookingReceived, sendGuestBookingApproved, sendGuestBookingRejected } = require("../utils/email");

/* ─────────────────────────────────────────
   POST /api/guest.bookings
   Create a guest booking — no auth required
───────────────────────────────────────── */
async function createGuestBooking(req, res, next) {
  try {
    const {
      ownerName, email, phone,
      petName, breed, gender, age, lastAntiRabiesShot,
      services, requestedGroomerId,
      appointmentDate, appointmentTime,
    } = req.body;

    // Validate required fields
    const missing = [];
    if (!ownerName)        missing.push("Owner name");
    if (!email)            missing.push("Email");
    if (!phone)            missing.push("Phone number");
    if (!petName)          missing.push("Pet name");
    if (!breed)            missing.push("Breed");
    if (!gender)           missing.push("Gender");
    if (!services?.length) missing.push("At least one service");
    if (!appointmentDate)  missing.push("Appointment date");
    if (!appointmentTime)  missing.push("Appointment time");

    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    // Enforce 3-hour advance booking for today
    const now             = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const [h, m]          = appointmentTime.split(":").map(Number);
    const slotDT          = new Date(appointmentDate);
    slotDT.setHours(h, m, 0, 0);

    const selDate = new Date(appointmentDate); selDate.setHours(0,0,0,0);
    const today   = new Date(); today.setHours(0,0,0,0);

    if (selDate.getTime() === today.getTime() && slotDT < threeHoursLater) {
      return res.status(400).json({ success: false, message: "Bookings must be made at least 3 hours in advance." });
    }

    const db = getDB();

    // Check slot conflict with regular bookings
    const dayStart = new Date(appointmentDate); dayStart.setHours(0,0,0,0);
    const dayEnd   = new Date(appointmentDate); dayEnd.setHours(23,59,59,999);

    const conflict = await db.collection("bookings").findOne({
      type: "grooming", status: "approved",
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      appointmentTime,
    });

    // Also check guest booking conflicts
    const guestConflict = await db.collection("guestBookings").findOne({
      status: "approved",
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      appointmentTime,
    });

    if (conflict || guestConflict) {
      return res.status(400).json({ success: false, message: "This time slot is already booked. Please choose another time." });
    }

    // Resolve groomer name
    let requestedGroomerName = null;
    if (requestedGroomerId) {
      const groomer = await db.collection("employees").findOne(
        { _id: new ObjectId(requestedGroomerId), role: "Groomer", status: "active" },
        { projection: { name: 1 } }
      );
      requestedGroomerName = groomer?.name || null;
    }

    const booking = {
      ownerName:            ownerName.trim(),
      email:                email.trim().toLowerCase(),
      phone:                phone.trim(),
      petName:              petName.trim(),
      breed:                breed.trim(),
      gender:               gender,
      age:                  age || null,
      lastAntiRabiesShot:   lastAntiRabiesShot ? new Date(lastAntiRabiesShot) : null,
      services:             Array.isArray(services) ? services : [services],
      requestedGroomerId:   requestedGroomerId ? new ObjectId(requestedGroomerId) : null,
      requestedGroomerName: requestedGroomerName,
      appointmentDate:      new Date(appointmentDate),
      appointmentTime,
      status:               "pending",
      type:                 "grooming",
      isGuest:              true,
      createdAt:            new Date(),
      updatedAt:            new Date(),
    };

    const result = await db.collection("guestBookings").insertOne(booking);
    booking._id = result.insertedId;

    // Send confirmation email (non-blocking)
    sendGuestBookingReceived(booking).catch(err => console.error("Email error:", err));

    res.json({
      success:  true,
      message:  "Booking request submitted! Please check your email for confirmation.",
      refNo:    result.insertedId,
    });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   GET /api/guest.bookings  (admin only)
───────────────────────────────────────── */
async function getGuestBookings(req, res, next) {
  try {
    const db     = getDB();
    const status = req.query.status || "pending";
    const filter = status === "all" ? {} : { status };
    const bookings = await db.collection("guestBookings").find(filter).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   PUT /api/guest.bookings/:id/approve
───────────────────────────────────────── */
async function approveGuestBooking(req, res, next) {
  try {
    const db     = getDB();
    const booking = await db.collection("guestBookings").findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) throw new NotFoundError("Booking not found");

    await db.collection("guestBookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "approved", approvedAt: new Date(), updatedAt: new Date() } }
    );

    sendGuestBookingApproved(booking).catch(err => console.error("Email error:", err));
    res.json({ success: true, message: "Guest booking approved! Email sent to customer." });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   PUT /api/guest.bookings/:id/reject
───────────────────────────────────────── */
async function rejectGuestBooking(req, res, next) {
  try {
    const { reason } = req.body;
    const db         = getDB();
    const booking    = await db.collection("guestBookings").findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) throw new NotFoundError("Booking not found");

    await db.collection("guestBookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "rejected", rejectReason: reason || "No reason provided", rejectedAt: new Date(), updatedAt: new Date() } }
    );

    sendGuestBookingRejected(booking, reason).catch(err => console.error("Email error:", err));
    res.json({ success: true, message: "Guest booking rejected. Email sent to customer." });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   PUT /api/guest.bookings/:id/pending
───────────────────────────────────────── */
async function revertGuestToPending(req, res, next) {
  try {
    const db = getDB();
    await db.collection("guestBookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: "pending", updatedAt: new Date() }, $unset: { approvedAt: "", rejectedAt: "", rejectReason: "" } }
    );
    res.json({ success: true, message: "Reverted to pending." });
  } catch (err) { next(err); }
}


/* ─────────────────────────────────────────
   POST /api/guest.bookings/hotel
   Create a guest hotel booking — no auth required
───────────────────────────────────────── */
async function createGuestHotelBooking(req, res, next) {
  try {
    const {
      ownerName, email, phone,
      petName, breed, gender, age,
      checkInDate, checkInTime,
      checkOutDate, checkOutTime,
      stayType,
    } = req.body;

    const missing = [];
    if (!ownerName)   missing.push("Owner name");
    if (!email)       missing.push("Email");
    if (!phone)       missing.push("Phone number");
    if (!petName)     missing.push("Pet name");
    if (!breed)       missing.push("Breed");
    if (!gender)      missing.push("Gender");
    if (!checkInDate) missing.push("Check-in date");
    if (!checkInTime) missing.push("Check-in time");
    if (!checkOutDate)missing.push("Check-out date");
    if (!checkOutTime)missing.push("Check-out time");
    if (!stayType)    missing.push("Stay type");

    if (missing.length)
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ success: false, message: "Invalid email address" });

    const checkIn  = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkOut <= checkIn)
      return res.status(400).json({ success: false, message: "Check-out date must be after check-in date" });

    const db = getDB();

    const booking = {
      ownerName:        ownerName.trim(),
      email:            email.trim().toLowerCase(),
      phone:            phone.trim(),
      petName:          petName.trim(),
      breed:            breed.trim(),
      gender,
      age:              age || null,
      stayType,
      appointmentDate:  new Date(checkInDate),
      appointmentTime:  checkInTime,
      hotelCheckoutDate: new Date(checkOutDate),
      hotelCheckoutTime: checkOutTime,
      status:           "pending",
      type:             "hotel",
      isGuest:          true,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    };

    const result = await db.collection("guestBookings").insertOne(booking);
    booking._id  = result.insertedId;

    // Send confirmation email (reuse grooming email — it shows services/type)
    booking.services = [stayType];
    sendGuestBookingReceived(booking).catch(err => console.error("Email error:", err));

    res.json({
      success: true,
      message: "Hotel booking request submitted! Please check your email for confirmation.",
      refNo:   result.insertedId,
    });
  } catch (err) { next(err); }
}

module.exports = { createGuestBooking, createGuestHotelBooking, getGuestBookings, approveGuestBooking, rejectGuestBooking, revertGuestToPending };