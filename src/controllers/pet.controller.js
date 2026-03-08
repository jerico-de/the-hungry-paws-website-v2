const { ObjectId } = require("mongodb");
const { getDB } = require("../config/database");
const { ValidationError, NotFoundError } = require("../utils/errors");

/**
 * Get all pets for logged-in user
 */
async function getPets(req, res, next) {
  try {
    const db = getDB();
    const userId = req.user?.id || req.session.user.id;

    const pets = await db
      .collection("pets")
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, pets });
  } catch (err) {
    next(err);
  }
}

/**
 * Add new pet
 */
async function addPet(req, res, next) {
  try {
    const { name, breed, age, gender, lastAntiRabiesShot } = req.body;
    const userId = req.user?.id || req.session.user.id;

    if (!name || !breed || !age || !gender) {
      throw new ValidationError("All fields are required");
    }

    if (age < 0 || age > 30) {
      throw new ValidationError("Invalid age — must be between 0 and 30");
    }

    if (!["male", "female"].includes(gender.toLowerCase())) {
      throw new ValidationError("Gender must be male or female");
    }

    const db = getDB();
    await db.collection("pets").insertOne({
      userId: new ObjectId(userId),
      name,
      breed,
      age: parseInt(age),
      gender: gender.toLowerCase(),
      lastAntiRabiesShot: lastAntiRabiesShot ? new Date(lastAntiRabiesShot) : null,
      photo: req.body.photo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ success: true, message: "Pet added successfully!" });
  } catch (err) {
    next(err);
  }
}

/**
 * Update pet
 */
async function updatePet(req, res, next) {
  try {
    const { name, breed, age, gender, lastAntiRabiesShot } = req.body;
    const userId = req.user?.id || req.session.user.id;

    if (!name || !breed || !age || !gender) {
      throw new ValidationError("All fields are required");
    }

    const updateData = {
      name,
      breed,
      age: parseInt(age),
      gender: gender.toLowerCase(),
      lastAntiRabiesShot: lastAntiRabiesShot ? new Date(lastAntiRabiesShot) : null,
      updatedAt: new Date(),
    };

    if (req.body.photo !== undefined) {
      updateData.photo = req.body.photo;
    }

    const db = getDB();
    const result = await db.collection("pets").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(userId),
      },
      { $set: updateData },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundError("Pet not found");
    }

    res.json({ success: true, message: "Pet updated successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete pet
 */
async function deletePet(req, res, next) {
  try {
    const userId = req.user?.id || req.session.user.id;
    const db = getDB();

    const result = await db.collection("pets").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Pet not found");
    }

    res.json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Get pet by ID
 */
async function getPetById(req, res, next) {
  try {
    const userId = req.user?.id || req.session.user.id;
    const db = getDB();

    const pet = await db.collection("pets").findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId),
    });

    if (!pet) {
      throw new NotFoundError("Pet not found");
    }

    res.json({ success: true, pet });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPets, addPet, updatePet, deletePet, getPetById };
