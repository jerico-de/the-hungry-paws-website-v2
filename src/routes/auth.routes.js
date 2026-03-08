const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const passport = require("../config/passport");
const { generateToken } = require("../utils/jwt");

router.post("/signup", authController.signup);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Google OAuth — initiate
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google OAuth — callback
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/?error=oauth_failed" }), (req, res) => {
  const user = req.user;

  // Generate JWT
  const token = generateToken(user);

  // Set session
  req.session.user = {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    contact: user.contact || "",
    isAdmin: user.isAdmin || false,
  };

  // First time Google login
  if (user.needsPassword) {
    return res.redirect(`/set-password.html?token=${token}`);
  }

  // Redirect to dashboard
  const redirect = user.isAdmin ? "/admin" : "/user";
  res.redirect(`${redirect}?token=${token}`);
});

router.post("/set-password", async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const { isStrongPassword } = require("../utils/validation");
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // Get user from session
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bcrypt = require("bcrypt");
    const { getDB } = require("../config/database");
    const { ObjectId } = require("mongodb");

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = getDB();

    await db.collection("users").updateOne(
      { _id: new ObjectId(req.session.user.id) },
      {
        $set: {
          password: hashedPassword,
          needsPassword: false,
          updatedAt: new Date(),
        },
      },
    );

    res.json({ success: true, message: "Password set successfully!" });
  } catch (err) {
    console.error("Set password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
