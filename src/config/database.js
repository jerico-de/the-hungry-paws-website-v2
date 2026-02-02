require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("hungry-paws");
    console.log("✅ MongoDB connected:", db.databaseName);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
}

module.exports = { connectDB, getDB };
