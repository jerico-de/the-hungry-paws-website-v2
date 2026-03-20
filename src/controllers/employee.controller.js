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

module.exports = { getMe, getMyLeaves, submitLeave, cancelLeave, getMyDuty };