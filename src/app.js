require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const petRoutes = require("./routes/pet.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminRoutes = require("./routes/admin.routes");
const contactRoutes = require("./routes/contact.routes");

const app = express();

// =====================
// Middleware
// =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Session middleware
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
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

// =====================
// API Routes
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);

// Legacy routes for backward compatibility
app.post("/api/signup", require("./controllers/auth.controller").signup);
app.post("/api/login", require("./controllers/auth.controller").login);
app.post("/logout", require("./controllers/auth.controller").logout);

// =====================
// View Engine Setup
// =====================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// =====================
// Page Routes
// =====================
app.get("/user", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  if (req.session.user.isAdmin) return res.redirect("/admin");
  res.render("user", { user: req.session.user });
});

app.get("/admin", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  if (!req.session.user.isAdmin) return res.redirect("/user");
  res.render("admin", { user: req.session.user });
});

// =====================
// Error Handling
// =====================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = app;
