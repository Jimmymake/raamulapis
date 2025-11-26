import mysql from "mysql2/promise";
import config from "../config/config.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

async function ensureProductsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      category VARCHAR(255),
      brand VARCHAR(255),
      price DECIMAL(10,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'USD',
      stock INT DEFAULT 0,
      unit VARCHAR(50),
      weight DECIMAL(10,2),
      packaging VARCHAR(255),
      composition TEXT,
      \`usage\` TEXT,
      images JSON,
      tags JSON,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(createTableSQL);
    console.log("Products table ensured");
  } catch (error) {
    console.error("Failed to ensure products table:", error.message);
  }
}

ensureProductsTable();

class Product {
  constructor(
    id,
    name,
    sku,
    description,
    category,
    brand,
    price,
    currency,
    stock,
    unit,
    weight,
    packaging,
    composition,
    usage,
    images,
    tags,
    status,
    created_at,
    updated_at
  ) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.description = description;
    this.category = category;
    this.brand = brand;
    this.price = price;
    this.currency = currency;
    this.stock = stock;
    this.unit = unit;
    this.weight = weight;
    this.packaging = packaging;
    this.composition = composition;
    this.usage = usage;
    this.images = images;
    this.tags = tags;
    this.status = status;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async create(productData) {
    const {
      name,
      sku,
      description,
      category,
      brand,
      price,
      currency = "USD",
      stock = 0,
      unit,
      weight,
      packaging,
      composition,
      usage,
      images = [],
      tags = [],
      status = "active",
    } = productData;

    if (!name || !sku || price === undefined || price === null) {
      throw new Error("name, sku, and price are required fields");
    }

    const imagesJson = JSON.stringify(images);
    const tagsJson = JSON.stringify(tags);

    const descriptionValue = description ?? null;
    const categoryValue = category ?? null;
    const brandValue = brand ?? null;
    const unitValue = unit ?? null;
    const weightValue = weight ?? null;
    const packagingValue = packaging ?? null;
    const compositionValue = composition ?? null;
    const usageValue = usage ?? null;

    const [result] = await pool.execute(
      `INSERT INTO products 
      (name, sku, description, category, brand, price, currency, stock, unit, weight, packaging, composition, \`usage\`, images, tags, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        sku,
        descriptionValue,
        categoryValue,
        brandValue,
        price,
        currency,
        stock,
        unitValue,
        weightValue,
        packagingValue,
        compositionValue,
        usageValue,
        imagesJson,
        tagsJson,
        status,
      ]
    );

    return await Product.findById(result.insertId);
  }

  static async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [id]);
    if (!rows[0]) return null;

    const product = rows[0];
    return new Product(
      product.id,
      product.name,
      product.sku,
      product.description,
      product.category,
      product.brand,
      product.price,
      product.currency,
      product.stock,
      product.unit,
      product.weight,
      product.packaging,
      product.composition,
      product.usage,
      product.images ? JSON.parse(product.images) : [],
      product.tags ? JSON.parse(product.tags) : [],
      product.status,
      product.created_at,
      product.updated_at
    );
  }

  static async findBySku(sku) {
    const [rows] = await pool.execute("SELECT * FROM products WHERE sku = ?", [sku]);
    if (!rows[0]) return null;

    const product = rows[0];
    return new Product(
      product.id,
      product.name,
      product.sku,
      product.description,
      product.category,
      product.brand,
      product.price,
      product.currency,
      product.stock,
      product.unit,
      product.weight,
      product.packaging,
      product.composition,
      product.usage,
      product.images ? JSON.parse(product.images) : [],
      product.tags ? JSON.parse(product.tags) : [],
      product.status,
      product.created_at,
      product.updated_at
    );
  }

  static async findAll(filters = {}) {
    let query = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (filters.category) {
      query += " AND category = ?";
      params.push(filters.category);
    }

    if (filters.brand) {
      query += " AND brand = ?";
      params.push(filters.brand);
    }

    if (filters.status) {
      query += " AND status = ?";
      params.push(filters.status);
    }

    if (filters.search) {
      query += " AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.execute(query, params);
    return rows.map((product) => {
      return new Product(
        product.id,
        product.name,
        product.sku,
        product.description,
        product.category,
        product.brand,
        product.price,
        product.currency,
        product.stock,
        product.unit,
        product.weight,
        product.packaging,
        product.composition,
        product.usage,
        product.images ? JSON.parse(product.images) : [],
        product.tags ? JSON.parse(product.tags) : [],
        product.status,
        product.created_at,
        product.updated_at
      );
    });
  }

  static async update(id, productData) {
    const {
      name,
      sku,
      description,
      category,
      brand,
      price,
      currency,
      stock,
      unit,
      weight,
      packaging,
      composition,
      usage,
      images,
      tags,
      status,
    } = productData;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (sku !== undefined) {
      updates.push("sku = ?");
      params.push(sku);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    if (category !== undefined) {
      updates.push("category = ?");
      params.push(category);
    }
    if (brand !== undefined) {
      updates.push("brand = ?");
      params.push(brand);
    }
    if (price !== undefined) {
      updates.push("price = ?");
      params.push(price);
    }
    if (currency !== undefined) {
      updates.push("currency = ?");
      params.push(currency);
    }
    if (stock !== undefined) {
      updates.push("stock = ?");
      params.push(stock);
    }
    if (unit !== undefined) {
      updates.push("unit = ?");
      params.push(unit);
    }
    if (weight !== undefined) {
      updates.push("weight = ?");
      params.push(weight);
    }
    if (packaging !== undefined) {
      updates.push("packaging = ?");
      params.push(packaging);
    }
    if (composition !== undefined) {
      updates.push("composition = ?");
      params.push(composition);
    }
    if (usage !== undefined) {
      updates.push("`usage` = ?");
      params.push(usage);
    }
    if (images !== undefined) {
      updates.push("images = ?");
      params.push(JSON.stringify(images));
    }
    if (tags !== undefined) {
      updates.push("tags = ?");
      params.push(JSON.stringify(tags));
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return await Product.findById(id);
    }

    params.push(id);
    await pool.execute(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, params);

    return await Product.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
}

export default Product;

