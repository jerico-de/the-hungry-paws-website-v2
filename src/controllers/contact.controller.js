const { getDB } = require("../config/database");
const { ObjectId } = require("mongodb");
const { ValidationError, NotFoundError } = require("../utils/errors");

/**
 * Submit contact form (public endpoint)
 */
async function submitContact(req, res, next) {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      throw new ValidationError("All fields are required");
    }

    if (message.length > 300) {
      throw new ValidationError("Message too long (max 300 characters)");
    }

    const db = getDB();
    await db.collection("contacts").insertOne({
      name,
      email,
      message,
      status: "unread",
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all contact messages (admin only)
 */
async function getContacts(req, res, next) {
  try {
    const status = req.query.status || "all";
    const db = getDB();

    const filter = status !== "all" ? { status } : {};
    const contacts = await db.collection("contacts").find(filter).sort({ createdAt: -1 }).toArray();

    res.json({ success: true, contacts });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark contact as read (admin only)
 */
async function markAsRead(req, res, next) {
  try {
    const db = getDB();
    const result = await db.collection("contacts").updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: "read", readAt: new Date() } });

    if (result.modifiedCount === 0) {
      throw new NotFoundError("Contact not found");
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete contact message (admin only)
 */
async function deleteContact(req, res, next) {
  try {
    const db = getDB();
    const result = await db.collection("contacts").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Contact not found");
    }

    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * Get unread count (admin only)
 */
async function getUnreadCount(req, res, next) {
  try {
    const db = getDB();
    const count = await db.collection("contacts").countDocuments({ status: "unread" });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitContact, getContacts, markAsRead, deleteContact, getUnreadCount };
