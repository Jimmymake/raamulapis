-- ============================================
-- RAAMUL E-COMMERCE - SAFE MIGRATIONS
-- Adds missing columns without breaking existing data
-- Run: mysql -u username -p database_name < migrations.sql
-- ============================================

DELIMITER //

-- ============================================
-- HELPER: Add column if it doesn't exist
-- ============================================
DROP PROCEDURE IF EXISTS add_column_if_not_exists//
CREATE PROCEDURE add_column_if_not_exists(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition VARCHAR(255)
)
BEGIN
  DECLARE column_exists INT DEFAULT 0;
  
  SELECT COUNT(*) INTO column_exists
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table
    AND COLUMN_NAME = p_column;
  
  IF column_exists = 0 THEN
    SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('✅ Added column: ', p_table, '.', p_column) AS Result;
  ELSE
    SELECT CONCAT('ℹ️  Column exists: ', p_table, '.', p_column) AS Result;
  END IF;
END//

-- ============================================
-- HELPER: Add index if it doesn't exist
-- ============================================
DROP PROCEDURE IF EXISTS add_index_if_not_exists//
CREATE PROCEDURE add_index_if_not_exists(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns VARCHAR(255)
)
BEGIN
  DECLARE index_exists INT DEFAULT 0;
  
  SELECT COUNT(*) INTO index_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table
    AND INDEX_NAME = p_index;
  
  IF index_exists = 0 THEN
    SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    SELECT CONCAT('✅ Added index: ', p_index) AS Result;
  ELSE
    SELECT CONCAT('ℹ️  Index exists: ', p_index) AS Result;
  END IF;
END//

-- ============================================
-- HELPER: Create table if not exists (returns status)
-- ============================================
DROP PROCEDURE IF EXISTS check_table_exists//
CREATE PROCEDURE check_table_exists(IN p_table VARCHAR(64))
BEGIN
  DECLARE table_exists INT DEFAULT 0;
  
  SELECT COUNT(*) INTO table_exists
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table;
  
  IF table_exists > 0 THEN
    SELECT CONCAT('✅ Table exists: ', p_table) AS Result;
  ELSE
    SELECT CONCAT('❌ Table missing: ', p_table) AS Result;
  END IF;
END//

DELIMITER ;

-- ============================================
-- RUN MIGRATIONS
-- ============================================

SELECT '🔄 Running migrations...' AS Status;

-- USERS TABLE MIGRATIONS
CALL add_column_if_not_exists('users', 'email_verified', 'BOOLEAN DEFAULT FALSE');
CALL add_column_if_not_exists('users', 'email_verification_token', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_not_exists('users', 'email_verification_expires', 'DATETIME DEFAULT NULL');
CALL add_column_if_not_exists('users', 'reset_password_token', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_not_exists('users', 'reset_password_expires', 'DATETIME DEFAULT NULL');
CALL add_column_if_not_exists('users', 'location', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_not_exists('users', 'phone', 'VARCHAR(50) DEFAULT NULL');
CALL add_column_if_not_exists('users', 'status', "ENUM('active', 'inactive', 'suspended') DEFAULT 'active'");
CALL add_column_if_not_exists('users', 'last_login', 'DATETIME DEFAULT NULL');
CALL add_column_if_not_exists('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- PRODUCTS TABLE MIGRATIONS
CALL add_column_if_not_exists('products', 'brand', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_not_exists('products', 'currency', "CHAR(3) DEFAULT 'KES'");
CALL add_column_if_not_exists('products', 'unit', 'VARCHAR(50) DEFAULT NULL');
CALL add_column_if_not_exists('products', 'weight', 'DECIMAL(10,2) DEFAULT NULL');
CALL add_column_if_not_exists('products', 'packaging', 'VARCHAR(255) DEFAULT NULL');
CALL add_column_if_not_exists('products', 'composition', 'TEXT DEFAULT NULL');
CALL add_column_if_not_exists('products', 'images', 'JSON DEFAULT NULL');
CALL add_column_if_not_exists('products', 'tags', 'JSON DEFAULT NULL');
CALL add_column_if_not_exists('products', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- ORDERS TABLE MIGRATIONS
CALL add_column_if_not_exists('orders', 'customer', 'JSON DEFAULT NULL');
CALL add_column_if_not_exists('orders', 'shipping', 'JSON DEFAULT NULL');
CALL add_column_if_not_exists('orders', 'payment', 'JSON DEFAULT NULL');
CALL add_column_if_not_exists('orders', 'notes', 'TEXT DEFAULT NULL');
CALL add_column_if_not_exists('orders', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- PAYMENTS TABLE MIGRATIONS
CALL add_column_if_not_exists('payments', 'callback_data', 'JSON DEFAULT NULL');
CALL add_column_if_not_exists('payments', 'result_code', 'INT DEFAULT NULL');
CALL add_column_if_not_exists('payments', 'result_desc', 'TEXT DEFAULT NULL');
CALL add_column_if_not_exists('payments', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- ADD INDEXES
CALL add_index_if_not_exists('users', 'idx_users_email', 'email');
CALL add_index_if_not_exists('users', 'idx_users_role', 'role');
CALL add_index_if_not_exists('users', 'idx_users_status', 'status');
CALL add_index_if_not_exists('products', 'idx_products_sku', 'sku');
CALL add_index_if_not_exists('products', 'idx_products_category', 'category');
CALL add_index_if_not_exists('orders', 'idx_orders_order_id', 'order_id');
CALL add_index_if_not_exists('orders', 'idx_orders_customer_id', 'customer_id');
CALL add_index_if_not_exists('payments', 'idx_payments_order_id', 'order_id');
CALL add_index_if_not_exists('order_tracking', 'idx_tracking_order_id', 'order_id');

SELECT '✅ Migrations complete!' AS Status;

-- ============================================
-- SHOW TABLE STATUS
-- ============================================
SELECT 
  TABLE_NAME as 'Table',
  TABLE_ROWS as 'Rows',
  ROUND(DATA_LENGTH/1024, 2) as 'Data (KB)',
  CREATE_TIME as 'Created'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

