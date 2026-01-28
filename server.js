require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const { connectDB, getDB } = require("./db");
const { ObjectId } = require("mongodb");

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// =====================
// Middleware
// =====================
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
// API ROUTES
// =====================

// Get logged-in user's pets
app.get("/api/pets", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  const db = getDB();
  const pets = db.collection("pets");

  pets
    .find({ userId: req.session.user.id })
    .toArray()
    .then((petsList) => {
      res.json({ success: true, pets: petsList });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    });
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
    const pets = db.collection("pets");

    await pets.insertOne({
      userId: req.session.user.id, // link to logged-in user
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

// Edit a pet
app.put("/api/pets/:id", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in" });

  const petId = req.params.id;
  const { name, breed, age } = req.body;

  if (!name || !breed || !age) return res.status(400).json({ success: false, message: "All fields are required" });

  try {
    const db = getDB();
    const pets = db.collection("pets");

    const result = await pets.updateOne({ _id: new ObjectId(petId), userId: req.session.user.id }, { $set: { name, breed, age } });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Pet not found or no changes made" });
    }

    res.json({ success: true, message: "Pet updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a pet
app.delete("/api/pets/:id", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Not logged in" });

  const petId = req.params.id;

  try {
    const db = getDB();
    const pets = db.collection("pets");

    const result = await pets.deleteOne({ _id: new ObjectId(petId), userId: req.session.user.id });

    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Pet not found" });

    res.json({ success: true, message: "Pet deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Sign up API
app.post("/api/signup", async (req, res) => {
  console.log("Signup request received!");
  try {
    const { fullName, email, contact, password } = req.body;

    if (!fullName || !email || !contact || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = getDB();
    if (!db) return res.status(500).json({ success: false, message: "Database not connected" });

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
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

// Log in API
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    // Find the user by email
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Success
    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    };

    res.json({
      success: true,
      message: "Login successful 🐾",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

// =====================
// Serve static files (frontend) last
// =====================
// HTML files
app.use(express.static("public"));

// EJS files
app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/user", isLoggedIn, (req, res) => {
  res.render("user", { user: req.session.user });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// =====================
// Start server
// =====================
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

startServer();
