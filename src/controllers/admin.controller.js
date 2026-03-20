const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { NotFoundError, ValidationError } = require("../utils/errors");

/* ─────────────────────────────────────────
   DASHBOARD STATS
───────────────────────────────────────── */
async function getDashboardStats(req, res, next) {
  try {
    const db = getDB();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const [
      groomingToday, checkInsToday, checkOutsToday, activeHotelStays,
      pendingTotal, totalGrooming, totalHotel, totalCustomers, totalEmployees, unreadMessages,
    ] = await Promise.all([
      db.collection("bookings").countDocuments({ type:"grooming", appointmentDate:{ $gte:todayStart, $lte:todayEnd } }),
      db.collection("bookings").countDocuments({ type:"hotel",    appointmentDate:{ $gte:todayStart, $lte:todayEnd } }),
      db.collection("bookings").countDocuments({ type:"hotel",    hotelCheckoutDate:{ $gte:todayStart, $lte:todayEnd } }),
      db.collection("bookings").countDocuments({ type:"hotel", status:"approved", appointmentDate:{ $lte:todayEnd }, hotelCheckoutDate:{ $gte:todayStart } }),
      db.collection("bookings").countDocuments({ status:"pending" }),
      db.collection("bookings").countDocuments({ type:"grooming" }),
      db.collection("bookings").countDocuments({ type:"hotel" }),
      db.collection("users").countDocuments({ role:{ $ne:"admin" } }),
      db.collection("employees").countDocuments({ status:"active" }).catch(() => 0),
      db.collection("contacts").countDocuments({ status:"unread" }).catch(() => 0),
    ]);

    res.json({
      success: true,
      stats: { groomingToday, checkInsToday, checkOutsToday, activeHotelStays, pendingTotal, totalGrooming, totalHotel, totalCustomers, totalEmployees, unreadMessages },
    });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   STAT DETAIL MODAL
───────────────────────────────────────── */
async function getStatDetail(req, res, next) {
  try {
    const { type } = req.query;
    const db = getDB();
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const QUERIES = {
      groomingToday:    { type:"grooming", appointmentDate:  { $gte:todayStart, $lte:todayEnd } },
      checkInsToday:    { type:"hotel",    appointmentDate:  { $gte:todayStart, $lte:todayEnd } },
      checkOutsToday:   { type:"hotel",    hotelCheckoutDate:{ $gte:todayStart, $lte:todayEnd } },
      pendingTotal:     { status:"pending" },
      activeHotelStays: { type:"hotel", status:"approved", appointmentDate:{ $lte:todayEnd }, hotelCheckoutDate:{ $gte:todayStart } },
    };

    const query = QUERIES[type];
    if (!query) return res.status(400).json({ success:false, message:"Unknown stat type" });

    const bookings = await db.collection("bookings").find(query).sort({ appointmentDate:1 }).toArray();
    const enriched = await Promise.all(bookings.map(async (b) => {
      const pets = await db.collection("pets").find({ _id:{ $in:b.pets||[] } }).toArray();
      const user = await db.collection("users").findOne({ _id:b.userId });
      return { ...b, pets, userName:user?.fullName||"Unknown", userEmail:user?.email||"Unknown", userContact:user?.contact||"Unknown" };
    }));

    res.json({ success:true, bookings:enriched });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   BOOKINGS
───────────────────────────────────────── */
async function getBookings(req, res, next) {
  try {
    const type   = req.query.type   || "grooming";
    const status = req.query.status || "pending";
    const db = getDB();

    const bookings = await db.collection("bookings").find({ type, status }).sort({ createdAt:-1 }).toArray();
    const enriched = await Promise.all(bookings.map(async (b) => {
      const pets = await db.collection("pets").find({ _id:{ $in:b.pets } }).toArray();
      const user = await db.collection("users").findOne({ _id:b.userId });
      return { ...b, pets, userName:user?.fullName||"Unknown", userEmail:user?.email||"Unknown", userContact:user?.contact||"Unknown" };
    }));

    res.json({ success:true, bookings:enriched });
  } catch (err) { next(err); }
}

async function approveBooking(req, res, next) {
  try {
    const adminId = req.user?.id || req.session.user.id;
    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status:"approved", approvedBy:adminId, approvedAt:new Date(), updatedAt:new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success:true, message:"Booking approved!" });
  } catch (err) { next(err); }
}

async function rejectBooking(req, res, next) {
  try {
    const { reason } = req.body;
    const adminId = req.user?.id || req.session.user.id;
    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status:"rejected", rejectedBy:adminId, rejectReason:reason||"No reason provided", rejectedAt:new Date(), updatedAt:new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success:true, message:"Booking rejected!" });
  } catch (err) { next(err); }
}

async function revertToPending(req, res, next) {
  try {
    const db = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set:{ status:"pending", updatedAt:new Date() }, $unset:{ approvedBy:"", approvedAt:"", rejectedBy:"", rejectReason:"", rejectedAt:"" } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success:true, message:"Booking reverted to pending." });
  } catch (err) { next(err); }
}

async function setBookingOutcome(req, res, next) {
  try {
    const { outcome, outcomeNote } = req.body;
    const VALID = ["completed", "no-show", "cancelled", "rescheduled"];
    if (!VALID.includes(outcome)) throw new ValidationError("Invalid outcome value");

    const db     = getDB();
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { outcome, outcomeNote: outcomeNote || "", outcomeAt: new Date(), updatedAt: new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Booking not found");
    res.json({ success:true, message:"Outcome saved." });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   EMPLOYEES
───────────────────────────────────────── */
async function getEmployees(req, res, next) {
  try {
    const db        = getDB();
    const employees = await db.collection("employees").find({}).sort({ name:1 }).toArray();
    res.json({ success:true, employees });
  } catch (err) { next(err); }
}

async function createEmployee(req, res, next) {
  try {
    const { name, role, email, contact, address, shift, dateHired, status, password, payroll } = req.body;
    if (!name || !role) throw new ValidationError("Name and role are required");

    const db   = getDB();
    const data = {
      name, role,
      email:     email     || "",
      contact:   contact   || "",
      address:   address   || "",
      shift:     shift     || "",
      dateHired: dateHired ? new Date(dateHired) : null,
      status:    status    || "active",
      payroll:   payroll   || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (password) {
      const bcrypt = require("bcrypt");
      data.password = await bcrypt.hash(password, 10);
    }

    const result = await db.collection("employees").insertOne(data);
    res.json({ success:true, message:"Employee added!", id:result.insertedId });
  } catch (err) { next(err); }
}

async function updateEmployee(req, res, next) {
  try {
    const { name, role, email, contact, address, shift, dateHired, status, password, payroll } = req.body;
    if (!name || !role) throw new ValidationError("Name and role are required");

    const db      = getDB();
    const updates = {
      name, role,
      email:     email     || "",
      contact:   contact   || "",
      address:   address   || "",
      shift:     shift     || "",
      dateHired: dateHired ? new Date(dateHired) : null,
      status:    status    || "active",
      payroll:   payroll   || {},
      updatedAt: new Date(),
    };

    if (password) {
      const bcrypt  = require("bcrypt");
      updates.password = await bcrypt.hash(password, 10);
    }

    const result = await db.collection("employees").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Employee not found");
    res.json({ success:true, message:"Employee updated!" });
  } catch (err) { next(err); }
}

async function deleteEmployee(req, res, next) {
  try {
    const db     = getDB();
    const result = await db.collection("employees").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) throw new NotFoundError("Employee not found");
    res.json({ success:true, message:"Employee deleted." });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   GROOMER ON DUTY
───────────────────────────────────────── */
async function getDuty(req, res, next) {
  try {
    const db   = getDB();
    const duty = await db.collection("duty").find({}).sort({ date:1 }).toArray();
    res.json({ success:true, duty });
  } catch (err) { next(err); }
}

async function assignDuty(req, res, next) {
  try {
    const { groomerId, date, notes } = req.body;
    if (!groomerId || !date) throw new ValidationError("Groomer and date are required");

    const db  = getDB();
    const emp = await db.collection("employees").findOne({ _id: new ObjectId(groomerId) });
    if (!emp) throw new NotFoundError("Employee not found");

    await db.collection("duty").insertOne({
      groomerId:   new ObjectId(groomerId),
      groomerName: emp.name,
      date:        new Date(date),
      notes:       notes || "",
      createdAt:   new Date(),
    });

    res.json({ success:true, message:"Duty assigned!" });
  } catch (err) { next(err); }
}

async function removeDuty(req, res, next) {
  try {
    const db     = getDB();
    const result = await db.collection("duty").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) throw new NotFoundError("Duty assignment not found");
    res.json({ success:true, message:"Duty assignment removed." });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   LEAVE REQUESTS
───────────────────────────────────────── */
async function getLeaves(req, res, next) {
  try {
    const db     = getDB();
    const leaves = await db.collection("leaves").find({}).sort({ createdAt:-1 }).toArray();
    res.json({ success:true, leaves });
  } catch (err) { next(err); }
}

async function createLeave(req, res, next) {
  try {
    const { employeeId, fromDate, toDate, leaveType, reason } = req.body;
    if (!employeeId || !fromDate || !toDate || !leaveType) throw new ValidationError("All fields are required");

    const db  = getDB();
    const emp = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) });
    if (!emp) throw new NotFoundError("Employee not found");

    await db.collection("leaves").insertOne({
      employeeId:   new ObjectId(employeeId),
      employeeName: emp.name,
      fromDate:     new Date(fromDate),
      toDate:       new Date(toDate),
      leaveType,
      reason:       reason || "",
      status:       "pending",
      createdAt:    new Date(),
      updatedAt:    new Date(),
    });

    res.json({ success:true, message:"Leave request filed." });
  } catch (err) { next(err); }
}

async function approveLeave(req, res, next) {
  try {
    const db     = getDB();
    const result = await db.collection("leaves").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status:"approved", updatedAt:new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Leave request not found");
    res.json({ success:true, message:"Leave approved." });
  } catch (err) { next(err); }
}

async function rejectLeave(req, res, next) {
  try {
    const db     = getDB();
    const result = await db.collection("leaves").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status:"rejected", updatedAt:new Date() } },
    );
    if (result.modifiedCount === 0) throw new NotFoundError("Leave request not found");
    res.json({ success:true, message:"Leave rejected." });
  } catch (err) { next(err); }
}

async function deleteLeave(req, res, next) {
  try {
    const db     = getDB();
    const result = await db.collection("leaves").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) throw new NotFoundError("Leave request not found");
    res.json({ success:true, message:"Leave request deleted." });
  } catch (err) { next(err); }
}

module.exports = {
  getDashboardStats, getStatDetail,
  getBookings, approveBooking, rejectBooking, revertToPending, setBookingOutcome,
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getDuty, assignDuty, removeDuty,
  getLeaves, createLeave, approveLeave, rejectLeave, deleteLeave,
};