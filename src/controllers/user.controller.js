const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { isStrongPassword, isValidEmail, isValidPhone } = require("../utils/validation");
const { sendPasswordChangedEmail } = require("../utils/email");

/**
 * Get user profile
 */
async function getProfile(req, res) {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.session.user.id) }, { projection: { password: 0, resetToken: 0, resetExpires: 0, verificationToken: 0 } });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    const { fullName, contact, address } = req.body;

    if (!fullName || !contact) {
      return res.status(400).json({ success: false, message: "Full name and contact are required" });
    }

    if (!isValidPhone(contact)) {
      return res.status(400).json({ success: false, message: "Invalid phone number format" });
    }

    const db = getDB();
    const users = db.collection("users");

    const result = await users.updateOne(
      { _id: new ObjectId(req.session.user.id) },
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update session
    req.session.user.fullName = fullName;
    req.session.user.contact = contact;

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Change password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }

    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(req.session.user.id) });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    );

    // Send confirmation email
    await sendPasswordChangedEmail(user.email, user.fullName);

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Delete account (soft delete)
 */
async function deleteAccount(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete account" });
    }

    const db = getDB();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(req.session.user.id) });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Soft delete (mark as deleted)
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    // Destroy session
    req.session.destroy();

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
