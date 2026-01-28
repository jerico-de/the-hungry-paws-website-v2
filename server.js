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
app.use(express.static("public"));

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
// AUTH & SESSION HELPERS
// =====================
function isAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
}

function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }
  next();
}

// =====================
// AUTH API
// =====================
app.post("/api/signup", async (req, res) => {
  try {
    const { fullName, email, contact, password, isAdmin } = req.body;

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
      isAdmin: isAdmin || false,
      createdAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

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
      isAdmin: user.isAdmin || false,
    };

    const redirect = req.session.user.isAdmin ? "/admin" : "/user";
    res.json({ success: true, redirect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// =====================
// PETS API
// =====================
app.get("/api/pets", isLoggedIn, async (req, res) => {
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

app.post("/api/pets", isLoggedIn, async (req, res) => {
  try {
    const { name, breed, age, gender } = req.body;

    if (!name || !breed || !age || !gender) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const db = getDB();
    await db.collection("pets").insertOne({
      userId: new ObjectId(req.session.user.id),
      name,
      breed,
      age,
      gender,
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Pet added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/api/pets/:id", isLoggedIn, async (req, res) => {
  try {
    const { name, breed, age, gender } = req.body;
    const db = getDB();

    const result = await db.collection("pets").updateOne(
      {
        _id: new ObjectId(req.params.id),
        userId: new ObjectId(req.session.user.id),
      },
      { $set: { name, breed, age, gender } },
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

app.delete("/api/pets/:id", isLoggedIn, async (req, res) => {
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
// BOOKINGS API (USER)
// =====================
app.get("/api/bookings", isLoggedIn, async (req, res) => {
  try {
    const type = req.query.type || "grooming";
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({
        userId: new ObjectId(req.session.user.id),
        type,
      })
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

app.post("/api/bookings", isLoggedIn, async (req, res) => {
  try {
    const { pets, type, antiRabiesDate, appointmentDate, appointmentTime, hotelCheckoutDate, hotelCheckoutTime } = req.body;

    if (!pets || !pets.length || !type || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (type === "grooming" && !antiRabiesDate) {
      return res.status(400).json({ success: false, message: "Anti-rabies date required for grooming" });
    }

    const db = getDB();
    await db.collection("bookings").insertOne({
      userId: new ObjectId(req.session.user.id),
      type,
      pets: pets.map((id) => new ObjectId(id)),
      antiRabiesDate: antiRabiesDate ? new Date(antiRabiesDate) : null,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      hotelCheckoutDate: hotelCheckoutDate ? new Date(hotelCheckoutDate) : null,
      hotelCheckoutTime: hotelCheckoutTime || null,
      status: "pending",
      createdAt: new Date(),
    });

    res.json({ success: true, message: "Booking created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete("/api/bookings/:id", isLoggedIn, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("bookings").deleteOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.session.user.id),
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
// ADMIN API
// =====================
app.get("/api/admin/bookings", isAdmin, async (req, res) => {
  try {
    const type = req.query.type || "grooming";
    const status = req.query.status || "pending";
    const db = getDB();

    const bookings = await db.collection("bookings").find({ type, status }).toArray();

    const petsCol = db.collection("pets");
    const usersCol = db.collection("users");

    const bookingsWithDetails = await Promise.all(
      bookings.map(async (b) => {
        const pets = await petsCol.find({ _id: { $in: b.pets } }).toArray();
        const user = await usersCol.findOne({ _id: b.userId });

        return {
          ...b,
          pets,
          userName: user ? user.fullName : "Unknown",
          userEmail: user ? user.email : "Unknown",
        };
      }),
    );

    res.json({ success: true, bookings: bookingsWithDetails });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/bookings/:id/approve", isAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("bookings").updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: "approved" } });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking approved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/admin/bookings/:id/reject", isAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("bookings").updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: "rejected" } });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking rejected!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================
// VIEWS
// =====================
app.set("view engine", "ejs");
app.set("views", "./views");

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
// START SERVER
// =====================
async function startServer() {
  await connectDB();
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}

startServer();
