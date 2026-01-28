require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const { connectDB, getDB } = require("./db");
const { ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// Middleware
// =====================
app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "hungry-paws-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: "hungry-paws",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

// =====================
// PETS API
// =====================

// Get logged-in user's pets
app.get("/api/pets", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const db = getDB();
    const pets = await db
      .collection("pets")
      .find({ userId: new ObjectId(req.session.user.id) })
      .toArray();

    res.json({ success: true, pets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add a new pet
app.post("/api/pets", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const { name, breed, age } = req.body;
    if (!name || !breed || !age) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = getDB();
    await db.collection("pets").insertOne({
      userId: new ObjectId(req.session.user.id),
      name,
      breed,
      age,
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Pet added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Edit pet
app.put("/api/pets/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  try {
    const { name, breed, age } = req.body;
    if (!name || !breed || !age) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = getDB();
    const result = await db.collection("pets").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.session.user.id),
      },
      { $set: { name, breed, age } },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Pet not found" });
    }

    res.json({ success: true, message: "Pet updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete pet
app.delete("/api/pets/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

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
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================
// AUTH API
// =====================

// Sign up
app.post("/api/signup", async (req, res) => {
  try {
    const { fullName, email, contact, password } = req.body;
    if (!fullName || !email || !contact || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await users.insertOne({
      fullName,
      email,
      contact,
      password: hashedPassword,
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    };

    res.json({ success: true, message: "Login successful 🐾" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================
// BOOKINGS API
// =====================

// Create booking
app.post("/api/bookings", async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const { pets, type, antiRabiesDate, appointmentDate, appointmentTime, hotelCheckoutDate, hotelCheckoutTime } = req.body;

    if (!pets || !pets.length || !type || !appointmentDate || !appointmentTime || !antiRabiesDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const db = getDB();
    await db.collection("bookings").insertOne({
      userId: new ObjectId(user.id),
      type, // grooming | hotel
      pets: pets.map((id) => new ObjectId(id)),
      antiRabiesDate: new Date(antiRabiesDate),
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      hotelCheckoutDate: hotelCheckoutDate ? new Date(hotelCheckoutDate) : null,
      hotelCheckoutTime: hotelCheckoutTime || null,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Booking saved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get bookings by type
app.get("/api/bookings", async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const type = req.query.type || "grooming";
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({ userId: new ObjectId(user.id), type })
      .toArray();

    const petsCol = db.collection("pets");

    const bookingsWithPets = await Promise.all(
      bookings.map(async (b) => {
        const pets = await petsCol.find({ _id: { $in: b.pets } }).toArray();
        return { ...b, pets };
      }),
    );

    res.json({ success: true, bookings: bookingsWithPets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -- Delete a booking
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).json({ success: false, message: "Not logged in" });

    const bookingId = req.params.id;
    const db = getDB();
    const bookings = db.collection("bookings");

    const result = await bookings.deleteOne({
      _id: new ObjectId(bookingId),
      userId: new ObjectId(user.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================
// ADMIN
// =====================

// Approve or reject booking
app.put("/api/admin/bookings/:id/status", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ success: false });
  }

  const { status } = req.body; // approved | rejected
  const bookingId = req.params.id;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  const db = getDB();
  await db.collection("bookings").updateOne({ _id: new ObjectId(bookingId) }, { $set: { status } });

  res.json({ success: true });
});

// Admin View Booking
app.get("/api/admin/bookings/pending", async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ success: false });
  }

  const db = getDB();
  const bookings = await db.collection("bookings").find({ status: "pending" }).toArray();

  res.json({ success: true, bookings });
});

// =====================
// FRONTEND
// =====================
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", "./views");

function isLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}

app.get("/user", isLoggedIn, (req, res) => {
  res.render("user", { user: req.session.user });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// =====================
// START SERVER
// =====================
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();
