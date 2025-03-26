import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const uri = process.env.MONGO_URI;
let _db; // Will hold the database connection

export const mongoConnect = async () => {
  const client = new MongoClient(uri, { monitorCommands: true });

  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    _db = client.db();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
};

// Function to get the database connection
export const getDb = () => {
  if (!_db) {
    throw new Error("No database found!");
  }
  return _db;
};
