// src/models/paymentModel.js
import mysql from "mysql2/promise";
import config from "../config/config.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

async function ensurePaymentsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(100) NOT NULL,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      merchant_request_id VARCHAR(100),
      checkout_request_id VARCHAR(100) UNIQUE,
      mpesa_receipt_number VARCHAR(100) UNIQUE,
      transaction_date BIGINT,
      payment_status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
      result_code INT,
      result_desc TEXT,
      callback_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_order_id (order_id),
      INDEX idx_user_id (user_id),
      INDEX idx_checkout_request (checkout_request_id),
      INDEX idx_payment_status (payment_status)
    )
  `;

  try {
    await pool.execute(createTableSQL);
    console.log("Payments table ensured");
  } catch (error) {
    console.error("Failed to ensure payments table:", error.message);
  }
}

ensurePaymentsTable();

class Payment {
  constructor(data) {
    this.id = data.id;
    this.order_id = data.order_id;
    this.user_id = data.user_id;
    this.amount = data.amount;
    this.phone_number = data.phone_number;
    this.merchant_request_id = data.merchant_request_id;
    this.checkout_request_id = data.checkout_request_id;
    this.mpesa_receipt_number = data.mpesa_receipt_number;
    this.transaction_date = data.transaction_date;
    this.payment_status = data.payment_status;
    this.result_code = data.result_code;
    this.result_desc = data.result_desc;
    this.callback_data = data.callback_data;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(paymentData) {
    const {
      order_id,
      user_id,
      amount,
      phone_number,
      merchant_request_id,
      checkout_request_id,
    } = paymentData;

    const [result] = await pool.execute(
      `INSERT INTO payments 
      (order_id, user_id, amount, phone_number, merchant_request_id, checkout_request_id, payment_status) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [order_id, user_id, amount, phone_number, merchant_request_id, checkout_request_id]
    );

    return await Payment.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM payments WHERE id = ?", [id]);
    if (!rows[0]) return null;
    
    const payment = rows[0];
    if (payment.callback_data && typeof payment.callback_data === 'string') {
      payment.callback_data = JSON.parse(payment.callback_data);
    }
    return new Payment(payment);
  }

  static async findByOrderId(order_id) {
    const [rows] = await pool.execute(
      "SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC",
      [order_id]
    );
    return rows.map(row => {
      if (row.callback_data && typeof row.callback_data === 'string') {
        row.callback_data = JSON.parse(row.callback_data);
      }
      return new Payment(row);
    });
  }

  static async findByCheckoutRequestId(checkout_request_id) {
    const [rows] = await pool.execute(
      "SELECT * FROM payments WHERE checkout_request_id = ?",
      [checkout_request_id]
    );
    if (!rows[0]) return null;
    
    const payment = rows[0];
    if (payment.callback_data && typeof payment.callback_data === 'string') {
      payment.callback_data = JSON.parse(payment.callback_data);
    }
    return new Payment(payment);
  }

  static async findByUserId(user_id, filters = {}) {
    let query = "SELECT * FROM payments WHERE user_id = ?";
    const params = [user_id];

    if (filters.payment_status) {
      query += " AND payment_status = ?";
      params.push(filters.payment_status);
    }

    if (filters.order_id) {
      query += " AND order_id = ?";
      params.push(filters.order_id);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.execute(query, params);
    return rows.map(row => {
      if (row.callback_data && typeof row.callback_data === 'string') {
        row.callback_data = JSON.parse(row.callback_data);
      }
      return new Payment(row);
    });
  }

  static async findAll(filters = {}, pagination = {}) {
    let baseQuery = "FROM payments WHERE 1=1";
    const params = [];

    if (filters.payment_status) {
      baseQuery += " AND payment_status = ?";
      params.push(filters.payment_status);
    }

    if (filters.user_id) {
      baseQuery += " AND user_id = ?";
      params.push(filters.user_id);
    }

    if (filters.order_id) {
      baseQuery += " AND order_id = ?";
      params.push(filters.order_id);
    }

    if (filters.phone_number) {
      baseQuery += " AND phone_number LIKE ?";
      params.push(`%${filters.phone_number}%`);
    }

    if (filters.date_from) {
      baseQuery += " AND created_at >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      baseQuery += " AND created_at <= ?";
      params.push(filters.date_to);
    }

    // Get total count
    const [countResult] = await pool.execute(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = countResult[0].total;

    // Get paginated results
    let query = `SELECT * ${baseQuery} ORDER BY created_at DESC`;
    
    if (pagination.limit) {
      query += ` LIMIT ${parseInt(pagination.limit)}`;
      if (pagination.offset) {
        query += ` OFFSET ${parseInt(pagination.offset)}`;
      }
    }

    const [rows] = await pool.execute(query, params);
    const payments = rows.map(row => {
      if (row.callback_data && typeof row.callback_data === 'string') {
        row.callback_data = JSON.parse(row.callback_data);
      }
      return new Payment(row);
    });

    return { payments, total };
  }

  static async updateStatus(checkout_request_id, updateData) {
    const {
      payment_status,
      result_code,
      result_desc,
      mpesa_receipt_number,
      transaction_date,
      callback_data,
    } = updateData;

    const updates = [];
    const params = [];

    if (payment_status !== undefined) {
      updates.push("payment_status = ?");
      params.push(payment_status);
    }
    if (result_code !== undefined) {
      updates.push("result_code = ?");
      params.push(result_code);
    }
    if (result_desc !== undefined) {
      updates.push("result_desc = ?");
      params.push(result_desc);
    }
    if (mpesa_receipt_number !== undefined) {
      updates.push("mpesa_receipt_number = ?");
      params.push(mpesa_receipt_number);
    }
    if (transaction_date !== undefined) {
      updates.push("transaction_date = ?");
      params.push(transaction_date);
    }
    if (callback_data !== undefined) {
      updates.push("callback_data = ?");
      params.push(JSON.stringify(callback_data));
    }

    if (updates.length === 0) return null;

    params.push(checkout_request_id);
    await pool.execute(
      `UPDATE payments SET ${updates.join(", ")} WHERE checkout_request_id = ?`,
      params
    );

    return await Payment.findByCheckoutRequestId(checkout_request_id);
  }

  static async getStatistics(user_id = null) {
    let query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as successful_payments,
        SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN payment_status = 'completed' THEN amount ELSE NULL END) as average_amount
      FROM payments
    `;

    const params = [];
    if (user_id) {
      query += " WHERE user_id = ?";
      params.push(user_id);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0];
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM payments WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

export default Payment;