import mysql from "mysql2/promise";
import config from "../config/config.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

async function ensureOrdersTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(100) NOT NULL UNIQUE,
      customer_id VARCHAR(100),
      customer JSON,
      items JSON NOT NULL,
      pricing JSON NOT NULL,
      shipping JSON,
      payment JSON,
      order_status ENUM('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(createTableSQL);
    console.log("Orders table ensured");
  } catch (error) {
    console.error("Failed to ensure orders table:", error.message);
  }
}

ensureOrdersTable();

class Order {
  constructor(
    id,
    order_id,
    customer_id,
    customer,
    items,
    pricing,
    shipping,
    payment,
    order_status,
    notes,
    created_at,
    updated_at
  ) {
    this.id = id;
    this.order_id = order_id;
    this.customer_id = customer_id;
    this.customer = customer;
    this.items = items;
    this.pricing = pricing;
    this.shipping = shipping;
    this.payment = payment;
    this.order_status = order_status;
    this.notes = notes;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static serializeJson(value, { required = false, label = "value" } = {}) {
    if (value === undefined || value === null) {
      if (required) {
        throw new Error(`${label} is required`);
      }
      return null;
    }

    // If it's already an object/array, stringify it
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    if (typeof value === "string") {
      // Prevent [object Object] breaking JSON.parse()
      if (value.startsWith("[object")) {
        return JSON.stringify({});
      }

      try {
        JSON.parse(value);
        return value;
      } catch {
        throw new Error(`${label} must be valid JSON`);
      }
    }

    // For other types, stringify them
    return JSON.stringify(value);
  }

  static ensureRequiredFields(order_id, items, pricing) {
    if (!order_id) {
      throw new Error("order_id is required");
    }
    if (!items) {
      throw new Error("items is required");
    }
    if (!pricing) {
      throw new Error("pricing is required");
    }
  }

  static async create(orderData) {
    const {
      order_id,
      customer_id,
      customer,
      items,
      pricing,
      shipping,
      payment,
      order_status = "pending",
      notes,
    } = orderData;

    Order.ensureRequiredFields(order_id, items, pricing);

    const customerJson = Order.serializeJson(customer, { label: "customer" });
    const itemsJson = Order.serializeJson(items, { required: true, label: "items" });
    const pricingJson = Order.serializeJson(pricing, { required: true, label: "pricing" });
    const shippingJson = Order.serializeJson(shipping, { label: "shipping" });
    const paymentJson = Order.serializeJson(payment, { label: "payment" });

    const [result] = await pool.execute(
      `INSERT INTO orders 
      (order_id, customer_id, customer, items, pricing, shipping, payment, order_status, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        customer_id,
        customerJson,
        itemsJson,
        pricingJson,
        shippingJson,
        paymentJson,
        order_status,
        notes,
      ]
    );

    return await Order.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM orders WHERE id = ?", [id]);
    if (!rows[0]) return null;

    return Order.mapRowToOrder(rows[0]);
  }

  static async findByOrderId(order_id) {
    const [rows] = await pool.execute("SELECT * FROM orders WHERE order_id = ?", [order_id]);
    if (!rows[0]) return null;

    return Order.mapRowToOrder(rows[0]);
  }

  static async findByCustomerId(customer_id) {
    const [rows] = await pool.execute("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC", [customer_id]);
    return rows.map((row) => Order.mapRowToOrder(row));
  }

  static async findAll(filters = {}, pagination = {}) {
    let baseQuery = "FROM orders WHERE 1=1";
    const params = [];

    if (filters.order_status) {
      baseQuery += " AND order_status = ?";
      params.push(filters.order_status);
    }

    if (filters.customer_id) {
      baseQuery += " AND customer_id = ?";
      params.push(filters.customer_id);
    }

    if (filters.search) {
      baseQuery += " AND (order_id LIKE ? OR customer_id LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
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
    const orders = rows.map((row) => Order.mapRowToOrder(row));

    return { orders, total };
  }

  static async update(id, orderData) {
    const {
      order_id,
      customer_id,
      customer,
      items,
      pricing,
      shipping,
      payment,
      order_status,
      notes,
    } = orderData;

    const updates = [];
    const params = [];

    if (order_id !== undefined) {
      updates.push("order_id = ?");
      params.push(order_id);
    }
    if (customer_id !== undefined) {
      updates.push("customer_id = ?");
      params.push(customer_id);
    }
    if (customer !== undefined) {
      updates.push("customer = ?");
      params.push(Order.serializeJson(customer, { label: "customer" }));
    }
    if (items !== undefined) {
      updates.push("items = ?");
      params.push(Order.serializeJson(items, { required: true, label: "items" }));
    }
    if (pricing !== undefined) {
      updates.push("pricing = ?");
      params.push(Order.serializeJson(pricing, { required: true, label: "pricing" }));
    }
    if (shipping !== undefined) {
      updates.push("shipping = ?");
      params.push(Order.serializeJson(shipping, { label: "shipping" }));
    }
    if (payment !== undefined) {
      updates.push("payment = ?");
      params.push(Order.serializeJson(payment, { label: "payment" }));
    }
    if (order_status !== undefined) {
      updates.push("order_status = ?");
      params.push(order_status);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes);
    }

    if (updates.length === 0) {
      return await Order.findById(id);
    }

    params.push(id);
    await pool.execute(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`, params);

    return await Order.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM orders WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  // Safe JSON parse helper
  static safeJsonParse(value, defaultValue = null) {
    if (!value) return defaultValue;
    if (typeof value === 'object') return value; // Already parsed by MySQL
    if (typeof value === 'string') {
      // Handle invalid "[object Object]" strings
      if (value.includes('[object Object]')) return defaultValue;
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  static mapRowToOrder(row) {
    return new Order(
      row.id,
      row.order_id,
      row.customer_id,
      Order.safeJsonParse(row.customer, null),
      Order.safeJsonParse(row.items, []),
      Order.safeJsonParse(row.pricing, null),
      Order.safeJsonParse(row.shipping, null),
      Order.safeJsonParse(row.payment, null),
      row.order_status,
      row.notes,
      row.created_at,
      row.updated_at
    );
  }
}

export default Order;


