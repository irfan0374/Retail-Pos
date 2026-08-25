CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','cashier')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applies_to TEXT NOT NULL DEFAULT 'both' CHECK (applies_to IN ('jewelry','gift','both'))
);

-- Minimal stub: full supplier CRUD is a Phase 2 module. Exists now purely so
-- products.supplier_id has clean FK integrity from day one.
CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('jewelry','gift')),
  category_id INTEGER REFERENCES categories(id),
  metal_type TEXT CHECK (metal_type IN ('gold','silver','platinum','imitation')),
  purity TEXT,
  gross_weight REAL,
  net_weight REAL,
  stone_weight REAL,
  making_charge REAL,
  making_charge_type TEXT CHECK (making_charge_type IN ('fixed','percent')),
  wastage_pct REAL,
  is_rate_based INTEGER NOT NULL DEFAULT 0,
  hallmark_no TEXT,
  cost_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  stock_qty REAL NOT NULL DEFAULT 0,
  low_stock_threshold REAL NOT NULL DEFAULT 0,
  supplier_id INTEGER REFERENCES suppliers(id),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);

CREATE TABLE metal_rates (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  metal_type TEXT NOT NULL,
  purity TEXT NOT NULL,
  rate_per_gram REAL NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, metal_type, purity)
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  trn TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sales (
  id INTEGER PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  customer_id INTEGER REFERENCES customers(id),
  payment_channel TEXT NOT NULL CHECK (payment_channel IN ('online','offline')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card','bank_transfer','payment_link')),
  cashier_id INTEGER NOT NULL REFERENCES users(id),
  subtotal REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0,
  vat_amount REAL NOT NULL,
  total REAL NOT NULL,
  -- 'held' is reserved for the Phase 4 hold/park-sale workflow; not used yet.
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','void','held'))
);

CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  description TEXT NOT NULL,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0,
  vat_amount REAL NOT NULL,
  line_total REAL NOT NULL,
  -- reserved for the Phase 4 old-gold exchange/buy-back workflow; not used yet.
  is_exchange_item INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id INTEGER,
  details TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
