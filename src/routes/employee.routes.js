const express            = require("express");
const router             = express.Router();
const c                  = require("../controllers/employee.controller");
const { requireEmployee } = require("../middleware/auth");

// GET  /api/employee/me          — employee profile
router.get("/me",           requireEmployee, c.getMe);

// GET  /api/employee/leave       — my leave history
// POST /api/employee/leave       — submit new leave request
router.get("/leave",        requireEmployee, c.getMyLeaves);
router.post("/leave",       requireEmployee, c.submitLeave);

// DELETE /api/employee/leave/:id — cancel a pending leave request
router.delete("/leave/:id", requireEmployee, c.cancelLeave);

// GET  /api/employee/duty        — my duty schedule (read-only)
router.get("/duty",         requireEmployee, c.getMyDuty);

module.exports = router;