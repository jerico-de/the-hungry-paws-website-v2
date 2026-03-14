const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { NotFoundError } = require("../utils/errors");

/**
 * Dashboard overview stats
 */
async function getDashboardStats(req, res, next) {
  try {
    const db = getDB();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const [
      groomingToday, checkInsToday, checkOutsToday, activeHotelStays,
      pendingTotal, totalGrooming, totalHotel, totalCustomers, totalEmployees, unreadMessages,
    ] = await Promise.all([
      db.collection("bookings").countDocuments({ type: "grooming", appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
      db.collection("bookings").countDocuments({ type: "hotel",    appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
      db.collection("bookings").countDocuments({ type: "hotel",    hotelCheckoutDate: { $gte: todayStart, $lte: todayEnd } }),
      db.collection("bookings").countDocuments({ type: "hotel", status: "approved", appointmentDate: { $lte: todayEnd }, hotelCheckoutDate: { $gte: todayStart } }),
      db.collection("bookings").countDocuments({ status: "pending" }),
      db.collection("bookings").countDocuments({ type: "grooming" }),
      db.collection("bookings").countDocuments({ type: "hotel" }),
      db.collection("users").countDocuments({ role: { $ne: "admin" } }),
      db.collection("users").countDocuments({ role: "employee" }).catch(() => 0),
      db.collection("contacts").countDocuments({ status: "unread" }).catch(() => 0),
    ]);

    res.json({
      success: true,
      stats: { groomingToday, checkInsToday, checkOutsToday, activeHotelStays, pendingTotal, totalGrooming, totalHotel, totalCustomers, totalEmployees, unreadMessages },
    });
  } catch (err) { next(err); }
}

/**
 * Booking detail list for a stat card modal.
 * ?type=groomingToday | checkInsToday | checkOutsToday | pendingTotal | activeHotelStays
 */
async function getStatDetail(req, res, next) {
  try {
    const { type } = req.query;
    const db = getDB();

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const QUERIES = {
      groomingToday:    { type: "grooming", appointmentDate:   { $gte: todayStart, $lte: todayEnd } },
      checkInsToday:    { type: "hotel",    appointmentDate:   { $gte: todayStart, $lte: todayEnd } },
      checkOutsToday:   { type: "hotel",    hotelCheckoutDate: { $gte: todayStart, $lte: todayEnd } },
      pendingTotal:     { status: "pending" },
      activeHotelStays: { type: "hotel", status: "approved", appointmentDate: { $lte: todayEnd }, hotelCheckoutDate: { $gte: todayStart } },
    };

    const query = QUERIES[type];
    if (!query) return res.status(400).json({ success: false, message: "Unknown stat type" });

    const bookings = await db.collection("bookings").find(query).sort({ appointmentDate: 1 }).toArray();

    const petsCol  = db.collection("pets");
    const usersCol = db.collection("users");

    const enriched = await Promise.all(
      bookings.map(async (b) => {
        const pets = await petsCol.find({ _id: { $in: b.pets || [] } }).toArray();
        const user = await usersCol.findOne({ _id: b.userId });
        return {
          ...b,
          pets,
          userName:    user ? user.fullName : "Unknown",
          userEmail:   user ? user.email    : "Unknown",
          userContact: user ? user.contact  : "Unknown",
        };
      }),
    );

    res.json({ success: true, bookings: enriched });
  } catch (err) { next(err); }
}

/**
 * Get all bookings (admin)
 */
async function getBookings(req, res, next) {
  try {
    const type   = req.query.type   || "grooming";
    const status = req.query.status || "pending";
    const db = getDB();

    const bookings = await db.collection("bookings").find({ type, status }).sort({ createdAt: -1 }).toArray();
    const petsCol  = db.collection("pets");
    const usersCol = db.collection("users");

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (b) => {
        const pets = await petsCol.find({ _id: { $in: b.pets } }).toArray();
        const user = await usersCol.findOne({ _id: b.userId });
        return { ...b, pets, userName: user?.fullName||"Unknown", userEmail: user?.email||"Unknown", userContact: user?.contact||"Unknown" };
      }),
    );

    res.json({ success: true, bookings: bookingsWithDetails });
  } catch (err) { next(err); }
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
      { $set: { status: "approved", approvedBy: adminId, approvedAt: new Date(), updatedAt: new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success: true, message: "Booking approved!" });
  } catch (err) { next(err); }
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
      { $set: { status: "rejected", rejectedBy: adminId, rejectReason: reason||"No reason provided", rejectedAt: new Date(), updatedAt: new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success: true, message: "Booking rejected!" });
  } catch (err) { next(err); }
}

/**
 * Revert booking to pending
 */
async function revertToPending(req, res, next) {
  try {
    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set:   { status: "pending", updatedAt: new Date() },
        $unset: { approvedBy: "", approvedAt: "", rejectedBy: "", rejectReason: "", rejectedAt: "" },
      },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success: true, message: "Booking reverted to pending." });
  } catch (err) { next(err); }
}

module.exports = { getDashboardStats, getStatDetail, getBookings, approveBooking, rejectBooking, revertToPending };