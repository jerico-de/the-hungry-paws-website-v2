const express    = require("express");
const router     = express.Router();
const authController = require("../controllers/auth.controller");
const passport   = require("../config/passport");
const { generateToken } = require("../utils/jwt");
const { getDB }  = require("../config/database");
const { ObjectId } = require("mongodb");
const bcrypt     = require("bcrypt");

/* ─────────────────────────────────────────
   STANDARD AUTH
───────────────────────────────────────── */
router.post("/signup",                authController.signup);
router.get("/verify-email/:token",    authController.verifyEmail);
router.post("/login",                 authController.login);
router.post("/logout",                authController.logout);
router.post("/forgot-password",       authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

/* ─────────────────────────────────────────
   GOOGLE OAUTH
───────────────────────────────────────── */
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/?error=oauth_failed" }),
  (req, res) => {
    const user  = req.user;
    const token = generateToken(user);

    req.session.user = {
      id:       user._id,
      fullName: user.fullName,
      email:    user.email,
      contact:  user.contact  || "",
      isAdmin:  user.isAdmin  || false,
    };

    if (user.needsPassword) {
      return res.redirect(`/set-password.html?token=${token}`);
    }

    const redirect = user.isAdmin ? "/admin" : "/user";
    res.redirect(`${redirect}?token=${token}`);
  }
);

/* ─────────────────────────────────────────
   SET PASSWORD  (first-time Google login)
───────────────────────────────────────── */
router.post("/set-password", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword)
      return res.status(400).json({ success: false, message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    const { isStrongPassword } = require("../utils/validation");
    const check = isStrongPassword(password);
    if (!check.valid)
      return res.status(400).json({ success: false, message: check.message });

    if (!req.session.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const db = getDB();
    await db.collection("users").updateOne(
      { _id: new ObjectId(req.session.user.id) },
      { $set: { password: await bcrypt.hash(password, 10), needsPassword: false, updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Password set successfully!" });
  } catch (err) {
    console.error("Set password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────
   EMPLOYEE LOGIN
   POST /api/auth/employee-login
   body: { employeeId, password }
   
   Employees don't have their own accounts in the users
   collection — they log in with their employee record ID
   and a password set by the admin. Add a `password` field
   to the employees collection when creating/editing staff.
───────────────────────────────────────── */
router.post("/employee-login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password)
      return res.status(400).json({ success: false, message: "Employee ID and password are required" });

    const db  = getDB();
    let emp;

    // Allow login by ObjectId or by email
    if (ObjectId.isValid(employeeId)) {
      emp = await db.collection("employees").findOne({ _id: new ObjectId(employeeId) });
    } else {
      emp = await db.collection("employees").findOne({ email: employeeId.toLowerCase().trim() });
    }

    if (!emp)
      return res.status(401).json({ success: false, message: "Employee not found" });

    if (emp.status === "inactive")
      return res.status(403).json({ success: false, message: "Your account is inactive. Contact your admin." });

    if (!emp.password)
      return res.status(401).json({ success: false, message: "No password set for this account. Contact your admin." });

    const match = await bcrypt.compare(password, emp.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Incorrect password" });

    // Set employee session
    req.session.employee = {
      id:   emp._id.toString(),
      name: emp.name,
      role: emp.role,
    };

    res.json({ success: true, message: "Login successful", redirect: "/employee-dashboard" });
  } catch (err) {
    console.error("Employee login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ─────────────────────────────────────────
   EMPLOYEE LOGOUT
   POST /api/auth/employee-logout
───────────────────────────────────────── */
router.post("/employee-logout", (req, res) => {
  req.session.employee = null;
  res.json({ success: true, message: "Logged out" });
});

module.exports = router;