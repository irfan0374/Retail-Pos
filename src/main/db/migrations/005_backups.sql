-- Plain ADD COLUMN is fine here (unlike the stock_movements CHECK-constraint change) since
-- SQLite supports adding nullable columns without a table rebuild.
ALTER TABLE app_settings ADD COLUMN backup_dir TEXT;
ALTER TABLE app_settings ADD COLUMN last_backup_at TEXT;
