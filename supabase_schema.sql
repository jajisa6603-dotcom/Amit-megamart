-- Supabase Database Schema for Amit Mega Mart POS & Inventory System
-- Copy and paste this script into your Supabase SQL Editor to set up the database tables.

-- ============================================================================
-- 1. DROP EXISTING TABLES (IF ANY)
-- ============================================================================
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ============================================================================
-- 2. CREATE PRODUCTS TABLE
-- ============================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index barcode and name for faster lookup
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);

-- ============================================================================
-- 3. CREATE SALES TABLE
-- ============================================================================
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash', -- Cash, UPI, Card
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    discount_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (tax_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_sales_created_at ON sales(created_at);

-- ============================================================================
-- 4. CREATE SALE_ITEMS TABLE
-- ============================================================================
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Allow public read and write operations for anonymous POS clients (simplified for POS terminal demo)
CREATE POLICY "Allow anonymous select on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on products" ON products FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select on sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on sales" ON sales FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on sales" ON sales FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select on sale_items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on sale_items" ON sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on sale_items" ON sale_items FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete on sale_items" ON sale_items FOR DELETE USING (true);

-- ============================================================================
-- 6. SEED INITIAL PRODUCT DATA
-- ============================================================================
INSERT INTO products (barcode, name, price, stock, category) VALUES
('12345', 'Premium Basmati Rice 1kg', 150.00, 50, 'Groceries'),
('12346', 'Refined Sunflower Oil 1L', 125.50, 30, 'Groceries'),
('12347', 'Tata Iodized Salt 1kg', 25.00, 100, 'Groceries'),
('89010', 'Maggi 2-Min Noodles 70g', 14.00, 200, 'Packaged Food'),
('89011', 'Britannia Marie Gold 250g', 35.00, 80, 'Packaged Food'),
('89012', 'Amul Butter 500g', 275.00, 25, 'Dairy'),
('89013', 'Colgate Dental Cream 200g', 110.00, 60, 'Personal Care'),
('89014', 'Dettol Liquid Handwash 200ml', 99.00, 45, 'Personal Care'),
('89015', 'Surf Excel Easy Wash 1kg', 140.00, 40, 'Household'),
('89016', 'Vim Dishwash Gel 500ml', 105.00, 55, 'Household'),
('89017', 'Haldirams Bhujia Sev 150g', 45.00, 90, 'Packaged Food'),
('89018', 'Cadbury Dairy Milk Silk 60g', 80.00, 15, 'Packaged Food'),
('89019', 'Coca-Cola Soft Drink 750ml', 40.00, 70, 'Beverages'),
('89020', 'Red Label Tea 250g', 115.00, 50, 'Beverages'),
('89021', 'Nescafe Classic Coffee 50g', 165.00, 35, 'Beverages');
