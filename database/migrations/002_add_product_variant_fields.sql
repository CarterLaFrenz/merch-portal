-- Migration: Add product variant fields (sizes, colors, limitedAvailability)
-- Date: 2026-01-20
-- Description: Adds fields for product variants to support frontend requirements

USE inventory_db;

-- Add sizes and colors as JSON fields
ALTER TABLE products
  ADD COLUMN sizes JSON AFTER image_url,
  ADD COLUMN colors JSON AFTER sizes,
  ADD COLUMN limited_availability BOOLEAN DEFAULT FALSE AFTER colors;

-- Add customer info to orders if not exists (for guest checkouts)
ALTER TABLE orders
  ADD COLUMN customer_email VARCHAR(255) AFTER user_id,
  ADD COLUMN customer_name VARCHAR(255) AFTER customer_email;

-- Add size selection to order_items
ALTER TABLE order_items
  ADD COLUMN selected_size VARCHAR(50) AFTER quantity;
