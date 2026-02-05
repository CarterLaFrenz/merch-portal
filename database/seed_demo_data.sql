-- Seed data for Nextlink Merch Portal Demo
-- Run this after schema setup to populate with demo data

USE inventory_db;

-- Clear existing data (be careful in production!)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM cart_items;
DELETE FROM refresh_tokens;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM users;

-- Reset auto-increment
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- ============================================
-- 1. Insert Categories
-- ============================================
INSERT INTO categories (name, description) VALUES
  ('T-Shirts', 'Premium cotton t-shirts with company branding'),
  ('Hoodies', 'Comfortable hoodies for all seasons'),
  ('Hats', 'Stylish caps and beanies'),
  ('Accessories', 'Tech accessories and other branded items');

-- ============================================
-- 2. Insert Demo Users
-- ============================================
-- Password for all users: "password123" (hashed with bcrypt)
-- Admin user: admin@nextlink.com / password123
-- Regular user: user@nextlink.com / password123

INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
  ('admin@nextlink.com', '$2a$10$rZ3qH5wF4mH5wF4mH5wF4uO5wF4mH5wF4mH5wF4mH5wF4mH5wF4mH', 'Admin User', 'admin', 1),
  ('user@nextlink.com', '$2a$10$rZ3qH5wF4mH5wF4mH5wF4uO5wF4mH5wF4mH5wF4mH5wF4mH5wF4mH', 'Regular User', 'user', 1),
  ('demo@nextlink.com', '$2a$10$rZ3qH5wF4mH5wF4mH5wF4uO5wF4mH5wF4mH5wF4mH5wF4mH5wF4mH', 'Demo User', 'user', 1);

-- ============================================
-- 3. Insert Products
-- ============================================

-- T-Shirts (Category 1)
INSERT INTO products (
  name, description, category_id, sku, price, stock_quantity, min_stock_level,
  image_url, sizes, colors, limited_availability, is_active
) VALUES
  (
    'Nextlink Classic T-Shirt',
    'Our signature cotton t-shirt featuring the Nextlink logo. Comfortable, breathable, and perfect for everyday wear.',
    1,
    'TSHIRT-CLASSIC-001',
    24.99,
    150,
    20,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    '["XS", "S", "M", "L", "XL", "2XL"]',
    '["Black", "White", "Navy", "Gray"]',
    0,
    1
  ),
  (
    'Nextlink Premium Polo',
    'Elevated polo shirt with embroidered logo. Perfect for professional events and casual Fridays.',
    1,
    'POLO-PREMIUM-001',
    39.99,
    75,
    15,
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500',
    '["S", "M", "L", "XL", "2XL"]',
    '["Navy", "White", "Charcoal"]',
    0,
    1
  ),
  (
    'Limited Edition Tech Tee',
    'Moisture-wicking performance tee with reflective logo. Limited production run.',
    1,
    'TSHIRT-TECH-LTD',
    34.99,
    25,
    5,
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500',
    '["S", "M", "L", "XL"]',
    '["Black", "Electric Blue"]',
    1,
    1
  );

-- Hoodies (Category 2)
INSERT INTO products (
  name, description, category_id, sku, price, stock_quantity, min_stock_level,
  image_url, sizes, colors, limited_availability, is_active
) VALUES
  (
    'Nextlink Zip-Up Hoodie',
    'Heavyweight fleece hoodie with full zip and embroidered logo. Your new favorite layer.',
    2,
    'HOODIE-ZIP-001',
    59.99,
    100,
    15,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
    '["S", "M", "L", "XL", "2XL"]',
    '["Black", "Navy", "Heather Gray"]',
    0,
    1
  ),
  (
    'Nextlink Pullover Hoodie',
    'Classic pullover hoodie with kangaroo pocket and drawstring hood.',
    2,
    'HOODIE-PULL-001',
    54.99,
    120,
    20,
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500',
    '["XS", "S", "M", "L", "XL", "2XL"]',
    '["Black", "Maroon", "Forest Green"]',
    0,
    1
  ),
  (
    'Limited Edition Quarter-Zip',
    'Premium quarter-zip pullover with tonal embroidery. Limited stock available.',
    2,
    'QUARTERZIP-LTD-001',
    69.99,
    30,
    5,
    'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500',
    '["S", "M", "L", "XL"]',
    '["Charcoal", "Navy"]',
    1,
    1
  );

-- Hats (Category 3)
INSERT INTO products (
  name, description, category_id, sku, price, stock_quantity, min_stock_level,
  image_url, sizes, colors, limited_availability, is_active
) VALUES
  (
    'Nextlink Snapback Cap',
    'Adjustable snapback cap with embroidered logo. One size fits most.',
    3,
    'CAP-SNAP-001',
    29.99,
    200,
    30,
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
    '["One Size"]',
    '["Black", "Navy", "White"]',
    0,
    1
  ),
  (
    'Nextlink Beanie',
    'Warm knit beanie for cold weather. Features woven Nextlink patch.',
    3,
    'BEANIE-001',
    24.99,
    150,
    25,
    'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500',
    '["One Size"]',
    '["Black", "Gray", "Navy"]',
    0,
    1
  ),
  (
    'Nextlink Dad Hat',
    'Unstructured low-profile cap with adjustable strap. Casual and comfortable.',
    3,
    'CAP-DAD-001',
    26.99,
    100,
    20,
    'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500',
    '["One Size"]',
    '["Black", "Khaki", "Navy"]',
    0,
    1
  );

-- Accessories (Category 4)
INSERT INTO products (
  name, description, category_id, sku, price, stock_quantity, min_stock_level,
  image_url, sizes, colors, limited_availability, is_active
) VALUES
  (
    'Nextlink Laptop Stickers',
    'Pack of 5 weatherproof stickers featuring various Nextlink designs.',
    4,
    'STICKER-PACK-001',
    9.99,
    500,
    50,
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500',
    NULL,
    NULL,
    0,
    1
  ),
  (
    'Nextlink Water Bottle',
    'Insulated stainless steel water bottle. Keeps drinks cold for 24 hours, hot for 12.',
    4,
    'BOTTLE-INSUL-001',
    34.99,
    80,
    15,
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
    NULL,
    '["Black", "Silver", "Navy"]',
    0,
    1
  ),
  (
    'Nextlink Tote Bag',
    'Canvas tote bag with screen-printed logo. Perfect for carrying your essentials.',
    4,
    'TOTE-CANVAS-001',
    19.99,
    120,
    20,
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500',
    NULL,
    '["Natural", "Black"]',
    0,
    1
  ),
  (
    'Nextlink Tech Backpack',
    'Premium backpack with padded laptop compartment and multiple organizational pockets.',
    4,
    'BACKPACK-TECH-001',
    79.99,
    50,
    10,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    NULL,
    '["Black", "Gray"]',
    0,
    1
  ),
  (
    'Limited Edition Enamel Pin Set',
    'Set of 3 collectible enamel pins. Limited production of 100 sets.',
    4,
    'PIN-ENAMEL-LTD',
    14.99,
    15,
    5,
    'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=500',
    NULL,
    NULL,
    1,
    1
  );

-- ============================================
-- Summary
-- ============================================
-- Categories: 4
-- Products: 14 (3 limited edition items)
-- Users: 3 (1 admin, 2 regular users)
-- Default password for all users: password123
