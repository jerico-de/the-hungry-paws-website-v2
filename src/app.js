require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const session    = require("express-session");
const MongoStore = require("connect-mongo");
const path       = require("path");
const passport   = require("./config/passport");
const { errorHandler } = require("./utils/errors");

const authRoutes         = require("./routes/auth.routes");
const userRoutes         = require("./routes/user.routes");
const petRoutes          = require("./routes/pet.routes");
const bookingRoutes      = require("./routes/booking.routes");
const adminRoutes        = require("./routes/admin.routes");
const contactRoutes      = require("./routes/contact.routes");
const uploadRouter       = require("./routes/upload.routes");
const employeesRouter    = require("./routes/employee.routes");
const guestBookingRouter = require("./routes/guest.booking.routes");
const feedbackRouter     = require("./routes/feedback.routes");

const app = express();

// =====================
// Security Middleware
// =====================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdn.jsdelivr.net",
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https://*.amazonaws.com",
          "https://www.google.com",
          "https://*.googleapis.com",
          "https://*.gstatic.com",
          "https://*.googleusercontent.com",
        ],

        
        connectSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
        ],

        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://maps.google.com",
        ],
      },
    },
  }),
);

// =====================
// General Middleware
// =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// =====================
// Session Middleware
// =====================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hungry-paws-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName:   "hungry-paws",
    }),
    cookie: {
      maxAge:   1000 * 60 * 60 * 24,
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    proxy: true,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// =====================
// API Routes
// =====================
app.use("/api/auth",          authRoutes);
app.use("/api/user",          userRoutes);
app.use("/api/pets",          petRoutes);
app.use("/api/bookings",      bookingRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/contact",       contactRoutes);
app.use("/api",               uploadRouter);
app.use("/api/employee",      employeesRouter);
app.use("/api/guest.bookings", guestBookingRouter);
app.use("/api/feedback",      feedbackRouter);

// Legacy routes
app.post("/api/signup", require("./controllers/auth.controller").signup);
app.post("/api/login",  require("./controllers/auth.controller").login);
app.post("/logout",     require("./controllers/auth.controller").logout);

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

app.get("/employee-dashboard", (req, res) => {
  if (!req.session.employee) return res.redirect("/");
  res.render("employee", { employee: req.session.employee });
});

// =====================
// 404 Handler
// =====================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// =====================
// Centralized Error Handler (must be last)
// =====================
app.use(errorHandler);

module.exports = app;