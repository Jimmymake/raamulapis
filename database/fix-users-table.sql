-- ============================================
-- FIX USERS TABLE - Production Repair Script
-- Run: mysql -u username -p database_name < fix-users-table.sql
-- ============================================

-- First, check current table structure
SELECT '📋 Current users table structure:' AS Status;
DESCRIBE users;

-- ============================================
-- ADD MISSING COLUMNS (Safe - won't error if exists)
-- ============================================

-- Check and add username column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN username VARCHAR(255) NOT NULL UNIQUE AFTER id', 
  'SELECT "username column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL UNIQUE AFTER username', 
  'SELECT "email column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add location column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'location'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN location VARCHAR(255) DEFAULT NULL', 
  'SELECT "location column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add phone column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL', 
  'SELECT "phone column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add password column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL', 
  'SELECT "password column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add role column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
);
SET @sql = IF(@column_exists = 0, 
  "ALTER TABLE users ADD COLUMN role ENUM('super_admin', 'admin', 'user') DEFAULT 'user'", 
  'SELECT "role column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add status column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
);
SET @sql = IF(@column_exists = 0, 
  "ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'", 
  'SELECT "status column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email_verified column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE', 
  'SELECT "email_verified column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email_verification_token column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_token'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) DEFAULT NULL', 
  'SELECT "email_verification_token column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add email_verification_expires column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verification_expires'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN email_verification_expires DATETIME DEFAULT NULL', 
  'SELECT "email_verification_expires column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add reset_password_token column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_password_token'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL', 
  'SELECT "reset_password_token column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add reset_password_expires column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reset_password_expires'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN reset_password_expires DATETIME DEFAULT NULL', 
  'SELECT "reset_password_expires column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_login column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL', 
  'SELECT "last_login column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add created_at column
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at'
);
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 
  'SELECT "created_at column exists" AS Info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- SHOW FINAL TABLE STRUCTURE
-- ============================================
SELECT '✅ Updated users table structure:' AS Status;
DESCRIBE users;

-- Show existing users
SELECT '👥 Existing users:' AS Status;
SELECT id, username, email, role, status FROM users;


