-- Migration: Add product fields, update orders, and add authentication
-- Date: 2026-01-20
-- Description: Adds missing product fields for frontend compatibility,
--              enhances orders table, and creates users table for JWT auth

USE inventory_db;

-- ============================================
-- 1. Update products table with missing fields
-- ============================================
ALTER TABLE products
  ADD COLUMN description TEXT AFTER name,
  ADD COLUMN imageUrl VARCHAR(500) AFTER description,
  ADD COLUMN category VARCHAR(50) AFTER imageUrl,
  ADD COLUMN sizes JSON AFTER category,
  ADD COLUMN colors JSON AFTER sizes,
  ADD COLUMN sku VARCHAR(100) AFTER colors,
  ADD COLUMN limitedAvailability BOOLEAN DEFAULT FALSE AFTER sku;

-- ============================================
-- 2. Update orders table with customer info
-- ============================================
ALTER TABLE orders
  ADD COLUMN customer_email VARCHAR(255) NOT NULL AFTER status,
  ADD COLUMN customer_name VARCHAR(255) NOT NULL AFTER customer_email,
  ADD COLUMN total DECIMAL(10,2) NOT NULL AFTER customer_name,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- ============================================
-- 3. Update order_items with price snapshot and size
-- ============================================
ALTER TABLE order_items
  ADD COLUMN price_at_purchase DECIMAL(10,2) NOT NULL AFTER quantity,
  ADD COLUMN size VARCHAR(50) AFTER price_at_purchase;

-- ============================================
-- 4. Create users table for authentication
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email)
);

-- ============================================
-- 5. Create refresh_tokens table for JWT
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
);

-- ============================================
-- 6. Add user_id to orders table (optional)
-- ============================================
ALTER TABLE orders
  ADD COLUMN user_id INT AFTER id,
  ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 7. Add indexes for performance
-- ============================================
ALTER TABLE products
  ADD INDEX idx_category (category),
  ADD INDEX idx_sku (sku);

ALTER TABLE orders
  ADD INDEX idx_customer_email (customer_email),
  ADD INDEX idx_status (status),
  ADD INDEX idx_created_at (created_at);
