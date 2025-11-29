// src/db/initDatabase.js
// Database initialization - creates all tables and seeds initial data

import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import config from "../config/config.js";

let pool;

// Initialize database connection
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

// ============================================
// TABLE DEFINITIONS
// ============================================

const TABLES = {
  // 1. USERS TABLE
  users: `
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_username (username),
      INDEX idx_role (role),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 2. PRODUCTS TABLE
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      category VARCHAR(255),
      brand VARCHAR(255),
      price DECIMAL(10,2) NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'KES',
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sku (sku),
      INDEX idx_category (category),
      INDEX idx_brand (brand),
      INDEX idx_status (status),
      INDEX idx_price (price)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 3. ORDERS TABLE
  orders: `
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_order_id (order_id),
      INDEX idx_customer_id (customer_id),
      INDEX idx_order_status (order_status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 4. PAYMENTS TABLE
  payments: `
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
      INDEX idx_payment_status (payment_status),
      INDEX idx_phone (phone_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 5. ORDER TRACKING TABLE
  order_tracking: `
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
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 6. CATEGORIES TABLE (Optional - for category management)
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      parent_id INT DEFAULT NULL,
      image VARCHAR(500),
      status ENUM('active', 'inactive') DEFAULT 'active',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
      INDEX idx_slug (slug),
      INDEX idx_parent (parent_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 7. REVIEWS TABLE (Optional - for product reviews)
  reviews: `
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title VARCHAR(255),
      comment TEXT,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_product (product_id),
      INDEX idx_user (user_id),
      INDEX idx_rating (rating),
      INDEX idx_status (status),
      UNIQUE KEY unique_review (product_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 8. WISHLIST TABLE (Optional)
  wishlist: `
    CREATE TABLE IF NOT EXISTS wishlist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_wishlist (user_id, product_id),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 9. CART TABLE (Optional)
  cart: `
    CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_cart_item (user_id, product_id),
      INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  // 10. ACTIVITY LOG TABLE (Audit Trail)
  activity_log: `
    CREATE TABLE IF NOT EXISTS activity_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id INT,
      old_data JSON,
      new_data JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_action (action),
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// ============================================
// CREATE TABLES FUNCTION
// ============================================

async function createTables(options = {}) {
  const { 
    tables = Object.keys(TABLES), // Create all tables by default
    verbose = true 
  } = options;

  const db = await getPool();
  const results = { success: [], failed: [] };

  console.log("\n🗄️  Creating database tables...\n");

  for (const tableName of tables) {
    if (!TABLES[tableName]) {
      console.log(`⚠️  Table '${tableName}' definition not found, skipping...`);
      continue;
    }

    try {
      await db.execute(TABLES[tableName]);
      results.success.push(tableName);
      if (verbose) {
        console.log(`✅ Table '${tableName}' created/verified`);
      }
    } catch (error) {
      results.failed.push({ table: tableName, error: error.message });
      console.error(`❌ Failed to create '${tableName}':`, error.message);
    }
  }

  console.log(`\n📊 Summary: ${results.success.length} tables created, ${results.failed.length} failed\n`);
  return results;
}

// ============================================
// SEED DATA FUNCTION
// ============================================

async function seedData(options = {}) {
  const { 
    createAdmins = true,
    createSampleProducts = false,
    createSampleCategories = false,
    verbose = true 
  } = options;

  const db = await getPool();
  console.log("\n🌱 Seeding database...\n");

  // 1. Create Super Admin & Admin
  if (createAdmins) {
    try {
      // Check if super admin exists
      const [existingSuperAdmin] = await db.execute(
        "SELECT id FROM users WHERE username = ?", 
        ["superadmin"]
      );

      if (existingSuperAdmin.length === 0) {
        const superAdminPassword = await bcrypt.hash("SuperAdmin@123", 10);
        await db.execute(
          `INSERT INTO users (username, email, password, role, status, email_verified) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ["superadmin", "superadmin@raamul.co.ke", superAdminPassword, "super_admin", "active", true]
        );
        if (verbose) console.log("✅ Super Admin created (superadmin / SuperAdmin@123)");
      } else {
        if (verbose) console.log("ℹ️  Super Admin already exists");
      }

      // Check if admin exists
      const [existingAdmin] = await db.execute(
        "SELECT id FROM users WHERE username = ?", 
        ["admin"]
      );

      if (existingAdmin.length === 0) {
        const adminPassword = await bcrypt.hash("Admin@123", 10);
        await db.execute(
          `INSERT INTO users (username, email, password, role, status, email_verified) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ["admin", "admin@raamul.co.ke", adminPassword, "admin", "active", true]
        );
        if (verbose) console.log("✅ Admin created (admin / Admin@123)");
      } else {
        if (verbose) console.log("ℹ️  Admin already exists");
      }
    } catch (error) {
      console.error("❌ Failed to create admin users:", error.message);
    }
  }

  // 2. Create Sample Categories
  if (createSampleCategories) {
    const categories = [
      { name: "Electronics", slug: "electronics", description: "Electronic devices and gadgets" },
      { name: "Clothing", slug: "clothing", description: "Fashion and apparel" },
      { name: "Home & Garden", slug: "home-garden", description: "Home improvement and garden" },
      { name: "Health & Beauty", slug: "health-beauty", description: "Health and beauty products" },
      { name: "Sports", slug: "sports", description: "Sports equipment and accessories" }
    ];

    for (const cat of categories) {
      try {
        await db.execute(
          `INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)`,
          [cat.name, cat.slug, cat.description]
        );
      } catch (error) {
        // Ignore duplicate errors
      }
    }
    if (verbose) console.log("✅ Sample categories created");
  }

  // 3. Create Sample Products
  if (createSampleProducts) {
    const products = [
      {
        name: "Wireless Bluetooth Headphones",
        sku: "HEADPHONE-001",
        description: "High-quality wireless headphones with noise cancellation",
        category: "Electronics",
        brand: "TechSound",
        price: 4500.00,
        stock: 50,
        images: JSON.stringify(["/uploads/products/headphones.jpg"]),
        tags: JSON.stringify(["wireless", "bluetooth", "audio"])
      },
      {
        name: "Cotton T-Shirt",
        sku: "TSHIRT-001",
        description: "Comfortable 100% cotton t-shirt",
        category: "Clothing",
        brand: "FashionWear",
        price: 1200.00,
        stock: 100,
        images: JSON.stringify(["/uploads/products/tshirt.jpg"]),
        tags: JSON.stringify(["cotton", "casual", "unisex"])
      },
      {
        name: "Smartphone Case",
        sku: "CASE-001",
        description: "Protective smartphone case with shock absorption",
        category: "Electronics",
        brand: "SafeGuard",
        price: 800.00,
        stock: 200,
        images: JSON.stringify(["/uploads/products/case.jpg"]),
        tags: JSON.stringify(["protection", "phone", "accessories"])
      }
    ];

    for (const product of products) {
      try {
        await db.execute(
          `INSERT IGNORE INTO products (name, sku, description, category, brand, price, currency, stock, images, tags) 
           VALUES (?, ?, ?, ?, ?, ?, 'KES', ?, ?, ?)`,
          [product.name, product.sku, product.description, product.category, product.brand, 
           product.price, product.stock, product.images, product.tags]
        );
      } catch (error) {
        // Ignore duplicate errors
      }
    }
    if (verbose) console.log("✅ Sample products created");
  }

  console.log("\n🌱 Seeding complete!\n");
}

// ============================================
// DROP TABLES FUNCTION (DANGER!)
// ============================================

async function dropTables(tableNames = []) {
  const db = await getPool();
  
  // Disable foreign key checks temporarily
  await db.execute("SET FOREIGN_KEY_CHECKS = 0");
  
  for (const table of tableNames) {
    try {
      await db.execute(`DROP TABLE IF EXISTS ${table}`);
      console.log(`🗑️  Dropped table '${table}'`);
    } catch (error) {
      console.error(`❌ Failed to drop '${table}':`, error.message);
    }
  }
  
  // Re-enable foreign key checks
  await db.execute("SET FOREIGN_KEY_CHECKS = 1");
}

// ============================================
// GET TABLE INFO
// ============================================

async function getTableInfo(tableName) {
  const db = await getPool();
  const [columns] = await db.execute(`DESCRIBE ${tableName}`);
  return columns;
}

async function listTables() {
  const db = await getPool();
  const [tables] = await db.execute("SHOW TABLES");
  return tables.map(t => Object.values(t)[0]);
}

// ============================================
// INITIALIZE DATABASE (Main Function)
// ============================================

async function initDatabase(options = {}) {
  const {
    createAllTables = true,
    seedAdmins = true,
    seedSampleData = false,
    verbose = true
  } = options;

  console.log("\n🚀 Initializing Raamul E-Commerce Database...\n");
  console.log("📍 Host:", config.db.host);
  console.log("📁 Database:", config.db.database);
  console.log("");

  try {
    // Test connection
    const db = await getPool();
    await db.execute("SELECT 1");
    console.log("✅ Database connection successful\n");

    // Create tables
    if (createAllTables) {
      await createTables({ verbose });
    }

    // Seed data
    await seedData({
      createAdmins: seedAdmins,
      createSampleProducts: seedSampleData,
      createSampleCategories: seedSampleData,
      verbose
    });

    console.log("🎉 Database initialization complete!\n");
    return { success: true };
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  initDatabase,
  createTables,
  seedData,
  dropTables,
  getTableInfo,
  listTables,
  TABLES,
  getPool
};

export default initDatabase;

// ============================================
// RUN DIRECTLY (node src/db/initDatabase.js)
// ============================================

// Check if this file is being run directly
const isMainModule = process.argv[1]?.includes('initDatabase');

if (isMainModule) {
  initDatabase({
    createAllTables: true,
    seedAdmins: true,
    seedSampleData: true,
    verbose: true
  }).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

