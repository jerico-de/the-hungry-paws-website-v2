const { getDB } = require("../config/database");
const { ObjectId } = require("mongodb");

/**
 * Submit contact form (public endpoint)
 */
async function submitContact(req, res) {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (message.length > 300) {
      return res.status(400).json({ success: false, message: "Message too long (max 300 characters)" });
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
    console.error("Submit contact error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Get all contact messages (admin only)
 */
async function getContacts(req, res) {
  try {
    const status = req.query.status || "all";
    const db = getDB();

    let filter = {};
    if (status !== "all") {
      filter.status = status;
    }

    const contacts = await db.collection("contacts").find(filter).sort({ createdAt: -1 }).toArray();

    res.json({ success: true, contacts });
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Mark contact as read (admin only)
 */
async function markAsRead(req, res) {
  try {
    const db = getDB();

    const result = await db.collection("contacts").updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: "read", readAt: new Date() } });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Delete contact message (admin only)
 */
async function deleteContact(req, res) {
  try {
    const db = getDB();

    const result = await db.collection("contacts").deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    res.json({ success: true, message: "Contact deleted" });
  } catch (err) {
    console.error("Delete contact error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Get unread count (admin only)
 */
async function getUnreadCount(req, res) {
  try {
    const db = getDB();
    const count = await db.collection("contacts").countDocuments({ status: "unread" });

    res.json({ success: true, count });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  submitContact,
  getContacts,
  markAsRead,
  deleteContact,
  getUnreadCount,
};
