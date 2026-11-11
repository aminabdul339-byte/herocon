CREATE TABLE sellers (canonical_id TEXT PRIMARY KEY, doppel_seller_id TEXT UNIQUE NOT NULL, seller_name TEXT, seller_url TEXT, product_count INTEGER DEFAULT 0, categories TEXT);
CREATE TABLE products (canonical_id TEXT PRIMARY KEY, doppel_product_id TEXT UNIQUE NOT NULL, title TEXT, price_text TEXT, price_gbp NUMERIC(10,2), category TEXT, category_id TEXT, seller_id TEXT REFERENCES sellers(doppel_seller_id), product_url TEXT, seller_url TEXT, image_url TEXT, page_url TEXT, source TEXT, collected_at TIMESTAMPTZ);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_title ON products(title);
