-- SQLite can't alter a CHECK constraint in place, so rebuild stock_movements to add
-- 'sale_return' to the allowed movement_type values.
ALTER TABLE stock_movements RENAME TO stock_movements_old;

CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty_delta REAL NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase','purchase_return','sale','sale_return')),
  reference_table TEXT NOT NULL,
  reference_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO stock_movements (id, product_id, qty_delta, movement_type, reference_table, reference_id, created_at)
  SELECT id, product_id, qty_delta, movement_type, reference_table, reference_id, created_at FROM stock_movements_old;

DROP TABLE stock_movements_old;
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);

-- Hold/park a sale: a lightweight snapshot of the cart, separate from `sales` so nothing about
-- stock, invoice numbering, or VAT is touched until it's resumed and actually finalized.
CREATE TABLE held_sales (
  id INTEGER PRIMARY KEY,
  cashier_id INTEGER NOT NULL REFERENCES users(id),
  note TEXT,
  bill_discount_amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE held_sale_items (
  id INTEGER PRIMARY KEY,
  held_sale_id INTEGER NOT NULL REFERENCES held_sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  description TEXT NOT NULL,
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  discount_amount REAL NOT NULL DEFAULT 0,
  is_exchange_item INTEGER NOT NULL DEFAULT 0
);

-- Returns/exchanges: append-only, linked to the original sale — never mutate sale history.
CREATE TABLE credit_notes (
  id INTEGER PRIMARY KEY,
  credit_note_no TEXT NOT NULL UNIQUE,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  reason TEXT,
  subtotal REAL NOT NULL,
  vat_amount REAL NOT NULL,
  total REAL NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE credit_note_items (
  id INTEGER PRIMARY KEY,
  credit_note_id INTEGER NOT NULL REFERENCES credit_notes(id),
  sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty REAL NOT NULL,
  unit_price REAL NOT NULL,
  vat_amount REAL NOT NULL,
  line_total REAL NOT NULL
);
