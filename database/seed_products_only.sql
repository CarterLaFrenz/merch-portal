-- Seed product data for Nextlink Employee Apparel Portal
-- Feb 2026 Employee Apparel Form items
-- Run this to populate with real products and categories

USE inventory_db;

-- Clear existing data (be careful in production!)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;

-- Reset auto-increment
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;

-- ============================================
-- 1. Insert Categories
-- ============================================
INSERT INTO categories (name, description) VALUES
  ('Hats, Backpacks, & Tumbler', 'Richardson hats, beanies, backpacks, tumbler, and cold-weather gear'),
  ('Shirts, Vest, Jackets and Bibs', 'Polos, t-shirts, hoodies, fishing shirts, jackets, vests, and Carhartt bibs');

-- ============================================
-- 2. Insert Products
-- ============================================

-- Hats, Backpacks, & Tumbler (Category 1)
INSERT INTO products (
  name, description, category_id, sku, price, stock_quantity, min_stock_level,
  image_url, sizes, colors, limited_availability, is_active
) VALUES
  (
    'Richardson 112 Snapback - Grey/White',
    'Richardson 112 snapback hat in grey and white with Nextlink logo.',
    1, 'RICH-112-GW', 13.00, 100, 10,
    '/uploads/RICH-112-GW.png',
    '["One Size"]', '["Grey", "White"]', 0, 1
  ),
  (
    'C826 Port Authority Fitted Hat - Grey/Black',
    'Port Authority fitted hat in grey and black. ONLY Small/Medium size available.',
    1, 'C826-GB', 13.00, 50, 5,
    '/uploads/C826-GB.png',
    '["S/M"]', '["Grey", "Black"]', 0, 1
  ),
  (
    'NE1120 New Era Stretch Mesh Contrast Stitch',
    'New Era stretch mesh hat with contrast stitching. Available in Small/Medium, Medium/Large, and Large/XL.',
    1, 'NE1120', 14.00, 75, 10,
    '/uploads/NE1120.png',
    '["S/M", "M/L", "L/XL"]', NULL, 0, 1
  ),
  (
    'Richardson R-Active 256 Snapback UPF 50+ - Grey/White Rope',
    'Richardson R-Active 256 snapback with UPF 50+ protection. Grey with white rope.',
    1, 'R256-GW', 15.00, 75, 10,
    '/uploads/R256-GW.png',
    '["One Size"]', '["Grey"]', 0, 1
  ),
  (
    'Richardson R-Active 256 Snapback UPF 50+ - Black/Black Rope',
    'Richardson R-Active 256 snapback with UPF 50+ protection. Black with black rope.',
    1, 'R256-BB', 15.00, 75, 10,
    '/uploads/R256-BB.png',
    '["One Size"]', '["Black"]', 0, 1
  ),
  (
    'Richardson R-Active 256 Snapback UPF 50+ - Orange/Black Rope',
    'Richardson R-Active 256 snapback with UPF 50+ protection. Orange with black rope.',
    1, 'R256-OB', 15.00, 75, 10,
    '/uploads/R256-OB.png',
    '["One Size"]', '["Orange"]', 0, 1
  ),
  (
    'Richardson 112FPR Snapback - Grey/Black with Black Rope',
    'Richardson 112FPR snapback in grey/black with black rope.',
    1, 'R112FPR-GBK', 13.00, 100, 10,
    '/uploads/R112FPR-GBK.png',
    '["One Size"]', '["Grey", "Black"]', 0, 1
  ),
  (
    'Richardson 112FPR Snapback - Black with White Rope',
    'Richardson 112FPR snapback in black with white rope.',
    1, 'R112FPR-BWH', 13.00, 100, 10,
    '/uploads/R112FPR-BWH.png',
    '["One Size"]', '["Black"]', 0, 1
  ),
  (
    'Richardson 112FPR Snapback - White with Black Rope',
    'Richardson 112FPR snapback in white with black rope.',
    1, 'R112FPR-WBK', 13.00, 100, 10,
    '/uploads/R112FPR-WBK.png',
    '["One Size"]', '["White"]', 0, 1
  ),
  (
    'Richardson 112FPR Snapback - Grey/White with White Rope',
    'Richardson 112FPR snapback in grey/white with white rope.',
    1, 'R112FPR-GWW', 13.00, 100, 10,
    '/uploads/R112FPR-GWW.png',
    '["One Size"]', '["Grey", "White"]', 0, 1
  ),
  (
    'Richardson 112FPR Snapback - Black Center Patch Logo',
    'Richardson 112FPR snapback with black center patch Nextlink logo.',
    1, 'R112FPR-BCP', 13.00, 100, 10,
    '/uploads/R112FPR-BCP.png',
    '["One Size"]', '["Black"]', 0, 1
  ),
  (
    'Richardson 112 Trucker Snapback - Black/White Patch Logo',
    'Richardson 112 trucker snapback with black/white patch logo.',
    1, 'R112T-BWP', 13.00, 100, 10,
    '/uploads/R112T-BWP.png',
    '["One Size"]', '["Black", "White"]', 0, 1
  ),
  (
    'Richardson 112 Trucker Snapback - Black Corner Logo',
    'Richardson 112 trucker snapback with black corner Nextlink logo.',
    1, 'R112T-BCL', 13.00, 100, 10,
    '/uploads/R112T-BCL.png',
    '["One Size"]', '["Black"]', 0, 1
  ),
  (
    'CP90L Black Beanie',
    'Classic knit beanie in black with embroidered Nextlink logo.',
    1, 'CP90L', 7.00, 150, 15,
    '/uploads/CP90L.png',
    '["One Size"]', '["Black"]', 0, 1
  ),
  (
    'CTA267 Carhartt Helmet Liner Mask',
    'Carhartt helmet liner mask for cold weather protection.',
    1, 'CTA267', 26.00, 50, 5,
    '/uploads/CTA267.png',
    '["One Size"]', NULL, 0, 1
  ),
  (
    '40 Ounce Nextlink Tumbler',
    '40oz insulated tumbler with Nextlink branding.',
    1, 'TUMBLER-40', 13.00, 100, 10,
    '/uploads/TUMBLER-40.png',
    NULL, NULL, 0, 1
  ),
  (
    'Brooks Brothers Grant BackPack BB18820',
    'Brooks Brothers Grant backpack (BB18820). Premium quality with Nextlink logo.',
    1, 'BB18820', 125.00, 25, 5,
    '/uploads/BB18820.png',
    NULL, NULL, 0, 1
  ),
  (
    'Brooks Brothers Grant Dual-Handle BackPack BB18821',
    'Brooks Brothers Grant dual-handle backpack (BB18821). Premium quality with Nextlink logo.',
    1, 'BB18821', 110.00, 25, 5,
    '/uploads/BB18821.png',
    NULL, NULL, 0, 1
  );

-- Shirts, Vest, Jackets and Bibs (Category 2)
INSERT INTO products (
  name, description, category_id, sku, price, stock_quantity, min_stock_level,
  image_url, sizes, colors, limited_availability, is_active
) VALUES
  (
    'Brooks Brothers Quilted Vest - Black BB18602',
    'Brooks Brothers quilted vest in black (BB18602) with Nextlink logo.',
    2, 'BB18602', 75.00, 30, 5,
    '/uploads/BB18602.png',
    '["S", "M", "L", "XL", "2XL"]', '["Black"]', 0, 1
  ),
  (
    'Port Authority Polo Black K569 / Sport-Tek RacerMesh Polo ST640',
    'Port Authority polo in black (K569) and Sport-Tek PosiCharge RacerMesh Polo (ST640).',
    2, 'K569-ST640', 22.00, 75, 10,
    '/uploads/K569-ST640.png',
    '["S", "M", "L", "XL", "2XL"]', '["Black"]', 0, 1
  ),
  (
    'Sport-Tek PosiCharge RacerMesh Polo ST640',
    'Sport-Tek PosiCharge RacerMesh Polo (ST640). Sizes Small through 3XL.',
    2, 'ST640', 22.00, 100, 10,
    '/uploads/ST640.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', NULL, 0, 1
  ),
  (
    'Sport-Tek T-Shirt Grey ST700',
    'Sport-Tek t-shirt in grey (ST700) with Nextlink logo.',
    2, 'ST700', 16.00, 100, 10,
    '/uploads/ST700.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Grey"]', 0, 1
  ),
  (
    'Sport-Tek Long Sleeve T-Shirt Grey ST700LS',
    'Sport-Tek long sleeve t-shirt in grey (ST700LS). Sizes Medium through 2XL.',
    2, 'ST700LS', 16.00, 75, 10,
    '/uploads/ST700LS.png',
    '["M", "L", "XL", "2XL"]', '["Grey"]', 0, 1
  ),
  (
    'Sport-Tek Hoodie Black/Grey ST267',
    'Sport-Tek hoodie in black and grey (ST267) with Nextlink logo.',
    2, 'ST267', 20.00, 75, 10,
    '/uploads/ST267.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Black", "Grey"]', 0, 1
  ),
  (
    'Long Sleeve Fishing Shirt',
    'Long sleeve fishing shirt with Nextlink logo. OUT OF STOCK in sizes Medium and Large.',
    2, 'FISH-LS', 15.00, 0, 5,
    '/uploads/FISH-LS.png',
    '["S", "XL", "2XL", "3XL"]', NULL, 1, 1
  ),
  (
    'Short Sleeve Fishing Shirt',
    'Short sleeve fishing shirt with Nextlink logo. LIMITED SIZES ONLY: Small, 2XL, 3XL, 4XL, 5XL, 6XL.',
    2, 'FISH-SS', 15.00, 30, 5,
    '/uploads/FISH-SS.png',
    '["S", "2XL", "3XL", "4XL", "5XL", "6XL"]', NULL, 1, 1
  ),
  (
    'Women''s Ogio Modern Performance Full Zip Jacket - Black LOE703',
    'Women''s Ogio Modern Performance Full Zip Jacket in black (LOE703). LIMITED SIZES ONLY: Small, Medium, Large.',
    2, 'LOE703', 45.00, 20, 5,
    '/uploads/LOE703.png',
    '["S", "M", "L"]', '["Black"]', 1, 1
  ),
  (
    'Women''s Ogio Extraction Soft Shell Jacket - Black LOG725',
    'Women''s Ogio Extraction Soft Shell Jacket in black (LOG725). LIMITED SIZES ONLY: Large.',
    2, 'LOG725', 60.00, 10, 3,
    '/uploads/LOG725.png',
    '["L"]', '["Black"]', 1, 1
  ),
  (
    'Port Authority Waterproof Jacket J331',
    'Port Authority waterproof jacket (J331) with Nextlink logo.',
    2, 'J331', 62.00, 50, 8,
    '/uploads/J331.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', NULL, 0, 1
  ),
  (
    'Brown Carhartt Bibs Regular Length CT106672',
    'Brown Carhartt bibs in regular length (CT106672).',
    2, 'CT106672', 114.00, 30, 5,
    '/uploads/CT106672.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Brown"]', 0, 1
  ),
  (
    'Brown Carhartt Bibs Tall Length CTT106672',
    'Brown Carhartt bibs in tall length (CTT106672).',
    2, 'CTT106672', 120.00, 25, 5,
    '/uploads/CTT106672.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Brown"]', 0, 1
  ),
  (
    'Brown Carhartt Jacket CT106677',
    'Brown Carhartt jacket (CT106677) with Nextlink logo.',
    2, 'CT106677', 110.00, 30, 5,
    '/uploads/CT106677.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Brown"]', 0, 1
  ),
  (
    'Black Carhartt Artic Yukon Bibs Regular Length 104461',
    'Black Carhartt Artic Yukon bibs in regular length (104461).',
    2, 'YUKON-REG', 210.00, 20, 3,
    '/uploads/YUKON-REG.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Black"]', 0, 1
  ),
  (
    'Black Carhartt Artic Yukon Bibs Tall Length 104461',
    'Black Carhartt Artic Yukon bibs in tall length (104461).',
    2, 'YUKON-TALL', 230.00, 15, 3,
    '/uploads/YUKON-TALL.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', '["Black"]', 0, 1
  ),
  (
    'Eddie Bauer WeatherEdge Plus 3-in-1 Jacket EB556',
    'Eddie Bauer WeatherEdge Plus 3-in-1 jacket (EB556) with Nextlink logo.',
    2, 'EB556', 206.00, 20, 3,
    '/uploads/EB556.png',
    '["S", "M", "L", "XL", "2XL", "3XL"]', NULL, 0, 1
  );

SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_products FROM products;
