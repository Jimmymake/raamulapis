// src/models/orderTrackingModel.js
import mysql from "mysql2/promise";
import config from "../config/config.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

async function ensureOrderTrackingTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS order_tracking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(100) NOT NULL,
      status ENUM('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned') NOT NULL,
      location VARCHAR(255),
      notes TEXT,
      updated_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_order_id (order_id),
      INDEX idx_status (status)
    )
  `;

  try {
    await pool.execute(createTableSQL);
    console.log("Order tracking table ensured");
  } catch (error) {
    console.error("Failed to ensure order tracking table:", error.message);
  }
}

ensureOrderTrackingTable();

class OrderTracking {
  constructor(data) {
    this.id = data.id;
    this.order_id = data.order_id;
    this.status = data.status;
    this.location = data.location;
    this.notes = data.notes;
    this.updated_by = data.updated_by;
    this.created_at = data.created_at;
  }

  static async create(trackingData) {
    const { order_id, status, location, notes, updated_by } = trackingData;

    const [result] = await pool.execute(
      `INSERT INTO order_tracking (order_id, status, location, notes, updated_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, status, location, notes, updated_by]
    );

    return await OrderTracking.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      "SELECT * FROM order_tracking WHERE id = ?",
      [id]
    );
    return rows[0] ? new OrderTracking(rows[0]) : null;
  }

  static async findByOrderId(order_id) {
    const [rows] = await pool.execute(
      `SELECT ot.*, u.username as updated_by_username 
       FROM order_tracking ot
       LEFT JOIN users u ON ot.updated_by = u.id
       WHERE ot.order_id = ? 
       ORDER BY ot.created_at ASC`,
      [order_id]
    );
    return rows.map(row => ({
      ...new OrderTracking(row),
      updated_by_username: row.updated_by_username
    }));
  }

  static async getLatestStatus(order_id) {
    const [rows] = await pool.execute(
      `SELECT ot.*, u.username as updated_by_username 
       FROM order_tracking ot
       LEFT JOIN users u ON ot.updated_by = u.id
       WHERE ot.order_id = ? 
       ORDER BY ot.created_at DESC 
       LIMIT 1`,
      [order_id]
    );
    return rows[0] ? {
      ...new OrderTracking(rows[0]),
      updated_by_username: rows[0].updated_by_username
    } : null;
  }

  static async getAllTracking(filters = {}) {
    let query = `
      SELECT ot.*, u.username as updated_by_username 
      FROM order_tracking ot
      LEFT JOIN users u ON ot.updated_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.order_id) {
      query += " AND ot.order_id = ?";
      params.push(filters.order_id);
    }

    if (filters.status) {
      query += " AND ot.status = ?";
      params.push(filters.status);
    }

    if (filters.date_from) {
      query += " AND ot.created_at >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += " AND ot.created_at <= ?";
      params.push(filters.date_to);
    }

    query += " ORDER BY ot.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));
    }

    const [rows] = await pool.execute(query, params);
    return rows.map(row => ({
      ...new OrderTracking(row),
      updated_by_username: row.updated_by_username
    }));
  }

  static async delete(id) {
    const [result] = await pool.execute(
      "DELETE FROM order_tracking WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  static async deleteByOrderId(order_id) {
    const [result] = await pool.execute(
      "DELETE FROM order_tracking WHERE order_id = ?",
      [order_id]
    );
    return result.affectedRows > 0;
  }
}

export default OrderTracking;