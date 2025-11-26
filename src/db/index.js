import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); 
console.log("DB_USER:", process.env.DB_USER);  // Should print: jimmy
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);// Must run before using process.env

// Create a pool (recommended for multiple queries)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test the connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log("Connected to the database.");
    connection.release(); // release back to the pool
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}

testConnection();

export default db;
