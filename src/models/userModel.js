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
      role ENUM('super_admin', 'admin', 'user') DEFAULT 'user',
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      email_verified BOOLEAN DEFAULT FALSE,
      email_verification_token VARCHAR(255),
      email_verification_expires DATETIME,
      reset_password_token VARCHAR(255),
      reset_password_expires DATETIME,
      last_login DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    await ensureColumn("role", "ENUM('super_admin', 'admin', 'user') DEFAULT 'user'");
    await ensureColumn("status", "ENUM('active', 'inactive', 'suspended') DEFAULT 'active'");
    await ensureColumn("email_verified", "BOOLEAN DEFAULT FALSE");
    await ensureColumn("email_verification_token", "VARCHAR(255)");
    await ensureColumn("email_verification_expires", "DATETIME");
    await ensureColumn("reset_password_token", "VARCHAR(255)");
    await ensureColumn("reset_password_expires", "DATETIME");
    await ensureColumn("last_login", "DATETIME");
    await ensureColumn("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

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
  constructor(id, username, email, location, phone, password, role, status, last_login, created_at) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.location = location;
    this.phone = phone;
    this.password = password;
    this.role = role;
    this.status = status || 'active';
    this.last_login = last_login;
    this.created_at = created_at;
  }

  static async create(username, email, location, phone, password, role = 'user') {
    // Convert undefined to null for MySQL
    const locationValue = location ?? null;
    const phoneValue = phone ?? null;
    
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, location, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
      [username, email, locationValue, phoneValue, password, role]
    );
    return new User(result.insertId, username, email, locationValue, phoneValue, password, role, 'active', null, new Date());
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    if (rows[0]) {
      return new User(
        rows[0].id,
        rows[0].username,
        rows[0].email,
        rows[0].location,
        rows[0].phone,
        rows[0].password,
        rows[0].role,
        rows[0].status,
        rows[0].last_login,
        rows[0].created_at
      );
    }
    return null;
  }

  static async findByUsername(username) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username]);
    if (rows[0]) {
      return new User(
        rows[0].id,
        rows[0].username,
        rows[0].email,
        rows[0].location,
        rows[0].phone,
        rows[0].password,
        rows[0].role,
        rows[0].status,
        rows[0].last_login,
        rows[0].created_at
      );
    }
    return null;
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (rows[0]) {
      return new User(
        rows[0].id,
        rows[0].username,
        rows[0].email,
        rows[0].location,
        rows[0].phone,
        rows[0].password,
        rows[0].role,
        rows[0].status,
        rows[0].last_login,
        rows[0].created_at
      );
    }
    return null;
  }

  // ✅ Add this method - this is what was missing!
  static async updateLastLogin(userId) {
    await pool.execute(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [userId]
    );
  }

  static async updateStatus(userId, status) {
    await pool.execute(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, userId]
    );
  }

  static async update(userId, updates) {
    const fields = [];
    const values = [];

    if (updates.username) {
      fields.push("username = ?");
      values.push(updates.username);
    }
    if (updates.email) {
      fields.push("email = ?");
      values.push(updates.email);
    }
    if (updates.location) {
      fields.push("location = ?");
      values.push(updates.location);
    }
    if (updates.phone) {
      fields.push("phone = ?");
      values.push(updates.phone);
    }
    if (updates.password) {
      fields.push("password = ?");
      values.push(updates.password);
    }
    if (updates.role) {
      fields.push("role = ?");
      values.push(updates.role);
    }
    if (updates.status) {
      fields.push("status = ?");
      values.push(updates.status);
    }

    if (fields.length === 0) return null;

    values.push(userId);
    await pool.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    return await User.findById(userId);
  }

  static async delete(userId) {
    await pool.execute("DELETE FROM users WHERE id = ?", [userId]);
  }

  static async getAll(filters = {}, pagination = {}) {
    let baseQuery = "FROM users WHERE 1=1";
    const values = [];

    if (filters.role) {
      baseQuery += " AND role = ?";
      values.push(filters.role);
    }
    if (filters.status) {
      baseQuery += " AND status = ?";
      values.push(filters.status);
    }
    if (filters.search) {
      baseQuery += " AND (username LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const [countResult] = await pool.execute(`SELECT COUNT(*) as total ${baseQuery}`, values);
    const total = countResult[0].total;

    // Get paginated results
    let query = `SELECT * ${baseQuery} ORDER BY created_at DESC`;
    
    if (pagination.limit) {
      query += ` LIMIT ${parseInt(pagination.limit)}`;
      if (pagination.offset) {
        query += ` OFFSET ${parseInt(pagination.offset)}`;
      }
    }

    const [rows] = await pool.execute(query, values);
    const users = rows.map(row => new User(
      row.id,
      row.username,
      row.email,
      row.location,
      row.phone,
      row.password,
      row.role,
      row.status,
      row.last_login,
      row.created_at
    ));

    return { users, total };
  }

  // Return user data without password
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      location: this.location,
      phone: this.phone,
      role: this.role,
      status: this.status,
      last_login: this.last_login,
      created_at: this.created_at
    };
  }

  // Count users by role (for statistics)
  static async countByRole() {
    const [rows] = await pool.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    return rows;
  }

  // Get user counts by status
  static async countByStatus() {
    const [rows] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM users 
      GROUP BY status
    `);
    return rows;
  }

  // Set password reset token
  static async setResetPasswordToken(userId, token, expiresAt) {
    await pool.execute(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [token, expiresAt, userId]
    );
  }

  // Find user by reset token
  static async findByResetToken(token) {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );
    if (rows[0]) {
      return new User(
        rows[0].id, rows[0].username, rows[0].email, rows[0].location,
        rows[0].phone, rows[0].password, rows[0].role, rows[0].status,
        rows[0].last_login, rows[0].created_at
      );
    }
    return null;
  }

  // Clear reset token after password change
  static async clearResetToken(userId) {
    await pool.execute(
      "UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [userId]
    );
  }

  // Set email verification token
  static async setEmailVerificationToken(userId, token, expiresAt) {
    await pool.execute(
      "UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?",
      [token, expiresAt, userId]
    );
  }

  // Find user by verification token
  static async findByVerificationToken(token) {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE email_verification_token = ? AND email_verification_expires > NOW()",
      [token]
    );
    if (rows[0]) {
      return new User(
        rows[0].id, rows[0].username, rows[0].email, rows[0].location,
        rows[0].phone, rows[0].password, rows[0].role, rows[0].status,
        rows[0].last_login, rows[0].created_at
      );
    }
    return null;
  }

  // Mark email as verified
  static async verifyEmail(userId) {
    await pool.execute(
      "UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?",
      [userId]
    );
  }

  // Check if email is verified
  static async isEmailVerified(userId) {
    const [rows] = await pool.execute(
      "SELECT email_verified FROM users WHERE id = ?",
      [userId]
    );
    return rows[0]?.email_verified || false;
  }
}

export default User;