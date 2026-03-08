const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { getDB } = require("../config/database");
const { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedEmail } = require("../utils/email");
const { isValidEmail, isStrongPassword } = require("../utils/validation");
const { generateToken } = require("../utils/jwt");
const { ValidationError, AuthError, NotFoundError } = require("../utils/errors");

/**
 * User signup with email verification
 */
async function signup(req, res, next) {
  try {
    const { fullName, email, contact, password, confirmPassword } = req.body;

    if (!fullName || !email || !contact || !password || !confirmPassword) {
      throw new ValidationError("All fields are required");
    }

    if (!isValidEmail(email)) {
      throw new ValidationError("Invalid email format");
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      throw new ValidationError(passwordCheck.message);
    }

    if (password !== confirmPassword) {
      throw new ValidationError("Passwords do not match");
    }

    const db = getDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      throw new ValidationError("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

    await sendVerificationEmail(email, verificationToken, fullName);

    res.json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Verify email
 */
async function verifyEmail(req, res, next) {
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
    next(err);
  }
}

/**
 * Login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError("Email and password required");
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      throw new AuthError("Invalid credentials");
    }

    if (!user.isVerified) {
      throw new AuthError("Please verify your email before logging in. Check your inbox for the verification link.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthError("Invalid credentials");
    }

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
    next(err);
  }
}

/**
 * Logout
 */
function logout(req, res) {
  req.session.destroy(() => res.redirect("/"));
}

/**
 * Forgot password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ValidationError("Email is required");
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

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await users.updateOne({ _id: user._id }, { $set: { resetToken, resetExpires, updatedAt: new Date() } });

    await sendPasswordResetEmail(email, resetToken, user.fullName);

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      throw new ValidationError("All fields are required");
    }

    if (password !== confirmPassword) {
      throw new ValidationError("Passwords do not match");
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      throw new ValidationError(passwordCheck.message);
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new ValidationError("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    await sendPasswordChangedEmail(user.email, user.fullName);

    res.json({ success: true, message: "Password reset successful! You can now log in." });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, verifyEmail, login, logout, forgotPassword, resetPassword };
