require("dotenv").config();
const { MongoClient } = require("mongodb");

const url = process.env.MONGO_URI; // Lấy từ .env
const dbName = process.env.DB_NAME; // Lấy từ .env

async function connectDb() {
  const client = new MongoClient(url);
  await client.connect();
  console.log("✅ Kết nối thành công đến MongoDB");
  return client.db(dbName);
}

module.exports = connectDb;
