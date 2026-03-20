const express = require("express");
const router  = express.Router();
const { requireAdmin } = require("../middleware/auth");
const c = require("../controllers/admin.controller");

/* Dashboard stats */
router.get("/dashboard-stats",         requireAdmin, c.getDashboardStats);
router.get("/dashboard-stats/detail",  requireAdmin, c.getStatDetail);

/* Bookings */
router.get("/bookings",                requireAdmin, c.getBookings);
router.put("/bookings/:id/approve",    requireAdmin, c.approveBooking);
router.put("/bookings/:id/reject",     requireAdmin, c.rejectBooking);
router.put("/bookings/:id/pending",    requireAdmin, c.revertToPending);
router.put("/bookings/:id/outcome",    requireAdmin, c.setBookingOutcome);

/* Employees */
router.get("/employees",               requireAdmin, c.getEmployees);
router.post("/employees",              requireAdmin, c.createEmployee);
router.put("/employees/:id",           requireAdmin, c.updateEmployee);
router.delete("/employees/:id",        requireAdmin, c.deleteEmployee);

/* Operations — groomer on duty */
router.get("/operations/duty",         requireAdmin, c.getDuty);
router.post("/operations/duty",        requireAdmin, c.assignDuty);
router.delete("/operations/duty/:id",  requireAdmin, c.removeDuty);

/* Operations — leave requests */
router.get("/operations/leave",               requireAdmin, c.getLeaves);
router.post("/operations/leave",              requireAdmin, c.createLeave);
router.put("/operations/leave/:id/approve",   requireAdmin, c.approveLeave);
router.put("/operations/leave/:id/reject",    requireAdmin, c.rejectLeave);
router.delete("/operations/leave/:id",        requireAdmin, c.deleteLeave);

module.exports = router;

/* Attendance */
router.get("/attendance",              requireAdmin, c.getAttendance);
router.post("/attendance/:id/adjust",  requireAdmin, c.adjustAttendance);
router.delete("/attendance/:id",       requireAdmin, c.deleteAttendance);

/* Payroll */
router.get("/payroll",                 requireAdmin, c.getPayroll);
router.post("/payroll/release",        requireAdmin, c.releasePayroll);
router.get("/payroll/history",         requireAdmin, c.getPayrollHistory);

/* Advance Salary */
router.get("/payroll/advances",        requireAdmin, c.getAdvances);
router.post("/payroll/advance",        requireAdmin, c.giveAdvance);
router.delete("/payroll/advance/:id",  requireAdmin, c.deleteAdvance);