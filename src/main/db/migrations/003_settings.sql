-- Singleton row (id is always 1) holding shop-level settings needed on invoices/reports.
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT '',
  trn TEXT NOT NULL DEFAULT ''
);
