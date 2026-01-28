require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { connectDB, getDB } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

// =====================
// Middleware
// =====================
app.use(express.json());

// =====================
// API ROUTES
// =====================
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

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const db = getDB();
    const users = db.collection("users");

    // 1. Find the user by email
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 2. Compare the provided password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // 3. Success (In a real app, you would issue a JWT or Session here)
    res.json({
      success: true,
      message: "Login successful 🐾",
      user: { fullName: user.fullName, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================
// Serve static files (frontend) last
// =====================
app.use(express.static("public"));

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
