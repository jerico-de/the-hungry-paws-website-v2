const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { getDB } = require("../config/database");
const { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require("../utils/email");
const { isValidEmail, isStrongPassword } = require("../utils/validation");
const { generateToken } = require("../utils/jwt");

/**
 * User signup with email verification
 */
async function signup(req, res) {
  try {
    const { fullName, email, contact, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !contact || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const db = getDB();
    const users = db.collection("users");

    // Check if user exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    await users.insertOne({
      fullName,
      email,
      contact,
      password: hashedPassword,
      isAdmin: false,
      isVerified: false,
      verificationToken,
      verificationExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken, fullName);

    res.json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Verify email
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Token</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2 style="color: #ff6b6b;">❌ Invalid or Expired Token</h2>
            <p>This verification link is invalid or has expired.</p>
            <a href="/" style="color: #ff69b4;">Go to Homepage</a>
          </body>
        </html>
      `);
    }

    // Update user
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          verificationToken: null,
          verificationExpires: null,
          updatedAt: new Date(),
        },
      },
    );

    res.send(`
      <html>
        <head><title>Email Verified</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #4caf50;">✅ Email Verified Successfully!</h2>
          <p>Your account has been verified. You can now log in.</p>
          <a href="/" style="background-color: #ff69b4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
            Go to Login
          </a>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).send("Server error");
  }
}

/**
 * Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    // Password checker
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // JWT token generation
    const token = generateToken(user);

    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      contact: user.contact,
      isAdmin: user.isAdmin || false,
    };

    const redirect = user.isAdmin ? "/admin" : "/user";
    res.json({ success: true, redirect, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Logout
 */
function logout(req, res) {
  req.session.destroy(() => res.redirect("/"));
}

/**
 * Forgot password - send reset link
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetExpires,
          updatedAt: new Date(),
        },
      },
    );

    // Send reset email
    await sendPasswordResetEmail(email, resetToken, user.fullName);

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Reset password using token
 */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetToken: null,
          resetExpires: null,
          updatedAt: new Date(),
        },
      },
    );

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.fullName);

    res.json({ success: true, message: "Password reset successful! You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  signup,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
