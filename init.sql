-- Raamul E-Commerce Database Initialization
-- This file runs automatically when MySQL container starts for the first time

-- Create database if not exists (already done by MYSQL_DATABASE env var)
-- CREATE DATABASE IF NOT EXISTS raamul_ecommerce;
-- USE raamul_ecommerce;

-- Note: Tables are auto-created by the API on startup
-- This file is for initial data seeding

-- Insert default super admin (password: SuperAdmin@123)
-- The password hash is generated using bcrypt with 10 rounds
INSERT INTO users (username, email, password, role, status, email_verified)
SELECT 'superadmin', 'superadmin@raamul.co.ke', 
       '$2b$10$U51qJrhRPZjisH.9wci9juufFI4rWb6ZTS9GurOUfz2VdMu0SXEPm', 
       'super_admin', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'superadmin');

-- Insert default admin (password: Admin@123)
INSERT INTO users (username, email, password, role, status, email_verified)
SELECT 'admin', 'admin@raamul.co.ke', 
       '$2b$10$ifCUGMYwk2Y3l4B2pnw8juWdW0bqmXGR65IBTm6bNg2P8Lav3Mb2K', 
       'admin', 'active', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Sample products (optional)
INSERT INTO products (name, sku, description, category, brand, price, currency, stock, status)
SELECT 'Sample Product', 'SAMPLE-001', 'This is a sample product', 'General', 'Raamul', 1000.00, 'KES', 100, 'active'
  WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SAMPLE-001');