require("dotenv").config();
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("hungry-paws");
    console.log("MongoDB connected:", db.databaseName);
  } catch (err) {
    console.log("MongoDB connection error:", err);
  }
}

function getDB() {
  return db;
}

module.exports = { connectDB, getDB };
