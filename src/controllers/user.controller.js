const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { isStrongPassword, isValidPhone } = require("../utils/validation");
const { sendPasswordChangedEmail } = require("../utils/email");
const { ValidationError, AuthError, NotFoundError } = require("../utils/errors");

/**
 * Get user profile
 */
async function getProfile(req, res, next) {
  try {
    const userId = req.user?.id || req.session.user.id;
    const db = getDB();

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { projection: { password: 0, resetToken: 0, resetExpires: 0, verificationToken: 0 } });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res, next) {
  try {
    const { fullName, contact, address } = req.body;
    const userId = req.user?.id || req.session.user.id;

    if (!fullName || !contact) {
      throw new ValidationError("Full name and contact are required");
    }

    if (!isValidPhone(contact)) {
      throw new ValidationError("Invalid phone number format");
    }

    const db = getDB();
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          fullName,
          contact,
          address: address || "",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundError("User not found");
    }

    req.session.user.fullName = fullName;
    req.session.user.contact = contact;

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Change password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user?.id || req.session.user.id;

    if (!currentPassword || !newPassword) {
      throw new ValidationError("All fields are required");
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      throw new ValidationError("New passwords do not match");
    }

    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      throw new ValidationError(passwordCheck.message);
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.password) {
      throw new ValidationError("This account uses Google sign-in. Please set a password first.");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new AuthError("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.collection("users").updateOne({ _id: user._id }, { $set: { password: hashedPassword, updatedAt: new Date() } });

    await sendPasswordChangedEmail(user.email, user.fullName);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete account (soft delete)
 */
async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    const userId = req.user?.id || req.session.user.id;

    if (!password) {
      throw new ValidationError("Password is required to delete account");
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthError("Incorrect password");
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    req.session.destroy();
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
