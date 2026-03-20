const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { ValidationError, NotFoundError, AuthenticationError } = require("../utils/errors");

/* ─────────────────────────────────────────
   GET /api/employee/me
   Returns the logged-in employee's record
───────────────────────────────────────── */
async function getMe(req, res, next) {
  try {
    const db  = getDB();
    const emp = await db.collection("employees").findOne({ _id: new ObjectId(req.employee.id) });
    if (!emp) throw new NotFoundError("Employee record not found");
    res.json({ success: true, employee: emp });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   GET /api/employee/leave
   All leave requests for this employee
───────────────────────────────────────── */
async function getMyLeaves(req, res, next) {
  try {
    const db     = getDB();
    const leaves = await db
      .collection("leaves")
      .find({ employeeId: new ObjectId(req.employee.id) })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ success: true, leaves });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   POST /api/employee/leave
   Submit a new leave request
───────────────────────────────────────── */
async function submitLeave(req, res, next) {
  try {
    const { fromDate, toDate, leaveType, reason } = req.body;

    if (!fromDate || !toDate || !leaveType) {
      throw new ValidationError("From date, to date, and leave type are required");
    }

    const db  = getDB();
    const emp = await db.collection("employees").findOne({ _id: new ObjectId(req.employee.id) });
    if (!emp) throw new NotFoundError("Employee not found");

    await db.collection("leaves").insertOne({
      employeeId:   new ObjectId(req.employee.id),
      employeeName: emp.name,
      fromDate:     new Date(fromDate),
      toDate:       new Date(toDate),
      leaveType,
      reason:       reason || "",
      status:       "pending",
      createdAt:    new Date(),
      updatedAt:    new Date(),
    });

    res.json({ success: true, message: "Leave request submitted successfully!" });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   DELETE /api/employee/leave/:id
   Cancel a pending leave request
───────────────────────────────────────── */
async function cancelLeave(req, res, next) {
  try {
    const db     = getDB();
    const result = await db.collection("leaves").deleteOne({
      _id:        new ObjectId(req.params.id),
      employeeId: new ObjectId(req.employee.id),
      status:     "pending", // can only cancel pending ones
    });
    if (result.deletedCount === 0) throw new NotFoundError("Leave request not found or already processed");
    res.json({ success: true, message: "Leave request cancelled." });
  } catch (err) { next(err); }
}

/* ─────────────────────────────────────────
   GET /api/employee/duty
   Duty schedule (read-only for employee)
───────────────────────────────────────── */
async function getMyDuty(req, res, next) {
  try {
    const db    = getDB();
    const duty  = await db
      .collection("duty")
      .find({ groomerId: new ObjectId(req.employee.id) })
      .sort({ date: 1 })
      .toArray();
    res.json({ success: true, duty });
  } catch (err) { next(err); }
}


/* ─────────────────────────────────────────
   GROOMING STATS
   Count confirmed-done bookings where this
   employee is the actualGroomerId
───────────────────────────────────────── */
async function getGroomingStats(req, res, next) {
  try {
    const db = getDB();
    const total = await db.collection("bookings").countDocuments({
      actualGroomerId: new ObjectId(req.employee.id),
      outcome:         "completed",
    });

    // Also get recent completions (last 5)
    const recent = await db.collection("bookings")
      .find({ actualGroomerId: new ObjectId(req.employee.id), outcome: "completed" })
      .sort({ outcomeAt: -1 })
      .limit(5)
      .toArray();

    res.json({ success: true, total, recent });
  } catch (err) { next(err); }
}

// exports at bottom

/* ─────────────────────────────────────────
   ATTENDANCE — EMPLOYEE SIDE
───────────────────────────────────────── */

async function timeIn(req, res, next) {
  try {
    const db  = getDB();
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    // Check if already timed in today without timing out
    const existing = await db.collection("attendance").findOne({
      employeeId: new ObjectId(req.employee.id),
      date: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing && !existing.timeOut) {
      return res.status(400).json({ success: false, message: "You are already timed in. Please time out first." });
    }

    const emp = await db.collection("employees").findOne({ _id: new ObjectId(req.employee.id) });

    await db.collection("attendance").insertOne({
      employeeId:   new ObjectId(req.employee.id),
      employeeName: emp?.name || req.employee.name,
      date:         todayStart,
      timeIn:       now,
      timeOut:      null,
      hoursWorked:  null,
      overtimeHours: null,
      status:       "present",
      createdAt:    now,
    });

    res.json({ success: true, message: "Timed in successfully!", timeIn: now });
  } catch (err) { next(err); }
}

async function timeOut(req, res, next) {
  try {
    const db  = getDB();
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    const record = await db.collection("attendance").findOne({
      employeeId: new ObjectId(req.employee.id),
      date: { $gte: todayStart, $lte: todayEnd },
      timeOut: null,
    });

    if (!record) {
      return res.status(400).json({ success: false, message: "No active time-in record found for today." });
    }

    const emp = await db.collection("employees").findOne({ _id: new ObjectId(req.employee.id) });
    const STANDARD_HOURS = 8;
    const hoursWorked  = (now - record.timeIn) / 3600000; // ms to hours
    const overtimeHours = Math.max(0, hoursWorked - STANDARD_HOURS);

    await db.collection("attendance").updateOne(
      { _id: record._id },
      { $set: {
        timeOut:       now,
        hoursWorked:   parseFloat(hoursWorked.toFixed(2)),
        overtimeHours: parseFloat(overtimeHours.toFixed(2)),
        updatedAt:     now,
      }}
    );

    res.json({
      success: true,
      message: "Timed out successfully!",
      timeOut: now,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
    });
  } catch (err) { next(err); }
}

async function getTodayAttendance(req, res, next) {
  try {
    const db  = getDB();
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    const record = await db.collection("attendance").findOne({
      employeeId: new ObjectId(req.employee.id),
      date: { $gte: todayStart, $lte: todayEnd },
    });

    res.json({ success: true, record: record || null });
  } catch (err) { next(err); }
}

async function getMyAttendance(req, res, next) {
  try {
    const db = getDB();
    const { from, to } = req.query;

    const filter = { employeeId: new ObjectId(req.employee.id) };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    const records = await db.collection("attendance").find(filter).sort({ date: -1 }).toArray();
    res.json({ success: true, records });
  } catch (err) { next(err); }
}

module.exports = { getMe, getMyLeaves, submitLeave, cancelLeave, getMyDuty, timeIn, timeOut, getTodayAttendance, getMyAttendance, getGroomingStats };