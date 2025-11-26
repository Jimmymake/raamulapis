import mysql from "mysql2/promise";
import config from "../config/config.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

async function ensureUsersTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      location VARCHAR(255),
      phone VARCHAR(50),
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user'
    )
  `;

  try {
    await pool.execute(createTableSQL);

    const ensureColumn = async (columnName, definition) => {
      const [rows] = await pool.execute(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [config.db.database, columnName]
      );

      if (rows.length === 0) {
        await pool.execute(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`);
      }
    };

    await ensureColumn("email", "VARCHAR(255)");
    await ensureColumn("location", "VARCHAR(255)");
    await ensureColumn("phone", "VARCHAR(50)");
    await ensureColumn("role", "ENUM('admin', 'user') DEFAULT 'user'");
    const [emailIndex] = await pool.execute(
      `SELECT INDEX_NAME
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND INDEX_NAME = 'users_email_unique'`,
      [config.db.database]
    );

    if (emailIndex.length === 0) {
      await pool.execute("ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email)");
    }
  } catch (error) {
    console.error("Failed to ensure users table:", error.message);
  }
}

ensureUsersTable();

class User {
  constructor(id, username,email,location,phone, password, role) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.location = location;
    this.phone = phone;
    this.password = password;
    this.role = role;
  }

  static async create(username, email, location, phone, password, role) {
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, location, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email, location, phone, password, role]
    );
    return new User(result.insertId, username, email, location, phone, password, role);
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] ? new User(rows[0].id, rows[0].username, rows[0].email, rows[0].location, rows[0].phone, rows[0].password, rows[0].role) : null;
  }

  static async findByUsername(username) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0] ? new User(rows[0].id, rows[0].username, rows[0].email, rows[0].location, rows[0].phone, rows[0].password, rows[0].role) : null;
  }
}

export default User;