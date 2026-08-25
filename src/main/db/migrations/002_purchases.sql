CREATE TABLE purchases (
  id INTEGER PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_ref TEXT,
  date TEXT NOT NULL DEFAULT (datetime('now')),
  subtotal REAL NOT NULL,
  total REAL NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE purchase_items (
  id INTEGER PRIMARY KEY,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL
);

-- Append-only, linked to the original purchase — never mutate purchase history.
CREATE TABLE purchase_returns (
  id INTEGER PRIMARY KEY,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id),
  reason TEXT,
  total REAL NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE purchase_return_items (
  id INTEGER PRIMARY KEY,
  purchase_return_id INTEGER NOT NULL REFERENCES purchase_returns(id),
  purchase_item_id INTEGER NOT NULL REFERENCES purchase_items(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty REAL NOT NULL,
  unit_cost REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE TABLE supplier_payments (
  id INTEGER PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  amount REAL NOT NULL,
  method TEXT,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Balance owed to a supplier is computed on read from purchases/purchase_returns/supplier_payments,
-- never stored, so there's nothing here to keep in sync.

CREATE TABLE stock_movements (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty_delta REAL NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase','purchase_return','sale')),
  reference_table TEXT NOT NULL,
  reference_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
