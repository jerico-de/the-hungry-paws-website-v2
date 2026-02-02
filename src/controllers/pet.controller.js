const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");

/**
 * Get all pets for logged-in user
 */
async function getPets(req, res) {
  try {
    const db = getDB();
    const pets = await db
      .collection("pets")
      .find({ userId: new ObjectId(req.session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, pets });
  } catch (err) {
    console.error("Get pets error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Add new pet
 */
async function addPet(req, res) {
  try {
    const { name, breed, age, gender } = req.body;

    if (!name || !breed || !age || !gender) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (age < 0 || age > 30) {
      return res.status(400).json({ success: false, message: "Invalid age" });
    }

    if (!["male", "female"].includes(gender.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Gender must be male or female" });
    }

    const db = getDB();
    await db.collection("pets").insertOne({
      userId: new ObjectId(req.session.user.id),
      name,
      breed,
      age: parseInt(age),
      gender: gender.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Pet added successfully!" });
  } catch (err) {
    console.error("Add pet error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Update pet
 */
async function updatePet(req, res) {
  try {
    const { name, breed, age, gender } = req.body;

    if (!name || !breed || !age || !gender) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = getDB();
    const result = await db.collection("pets").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.session.user.id),
      },
      {
        $set: {
          name,
          breed,
          age: parseInt(age),
          gender: gender.toLowerCase(),
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    res.json({ success: true, message: "Pet updated successfully" });
  } catch (err) {
    console.error("Update pet error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Delete pet
 */
async function deletePet(req, res) {
  try {
    const db = getDB();
    const result = await db.collection("pets").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.session.user.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    res.json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    console.error("Delete pet error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  getPets,
  addPet,
  updatePet,
  deletePet,
};
