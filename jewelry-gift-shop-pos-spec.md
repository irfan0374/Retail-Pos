# Offline POS System — Jewelry & Gift Shop (UAE)
### Project Specification / Build Brief

---

## 1. Project Summary

A **fully offline, desktop-based Point of Sale system** for a jewelry and gift retail shop operating in the UAE. All data (products, sales, purchases, users) is stored on a **local database on the shop's computer** — no internet dependency for daily operations. The system must handle both fine jewelry (weight/purity-based pricing) and general gift items (simple SKU pricing) in one workflow, be UAE VAT-compliant, and integrate with standard retail hardware (barcode scanner, thermal printer, cash drawer).

**Core principle:** Works completely offline. Internet is only used later (optional, future phase) for cloud backup/sync — never a requirement for making a sale.

---

## 2. Recommended Tech Stack

| Layer | Recommendation | Why |
|---|---|---|
| App shell | **Electron + React** | Cross-platform desktop app, rich UI, easiest to make a modern touch-friendly POS interface |
| Local database | **SQLite** (via `better-sqlite3`) | Single-file, zero-config, stored entirely on the local machine, fast for POS-scale data |
| Barcode generation | `bwip-js` or `jsbarcode` | Generates Code128/EAN-13 barcodes as images for labels |
| Barcode scanning | Any standard **USB HID barcode scanner** | Acts as a keyboard — no SDK needed, scans directly into the input field |
| Receipt printing | `node-thermal-printer` (ESC/POS) | Works with standard 58mm/80mm thermal printers over USB or LAN |
| Cash drawer | Triggered via printer's **RJ11 kick-out port** using an ESC/POS pulse command | Drawer is usually wired through the printer, not the PC directly |
| Excel export | `exceljs` or `xlsx` | Generates .xlsx sales/VAT/purchase registers |
| Packaging | `electron-builder` | Produces a single Windows `.exe` installer (most POS terminals in UAE run Windows) |

*(If you'd rather use Python + PySide6/PyQt6 + SQLite, or .NET/WPF, the module breakdown below applies identically — this is just the recommended default.)*

---

## 3. Functional Modules

### 3.1 Authentication & User Management
- Login screen (username + password), password hashed with bcrypt even though local
- Roles: **Admin**, **Manager**, **Cashier** — cashier cannot edit prices beyond a set discount limit, cannot delete completed sales, cannot access financial reports
- Visible **Logout** button on every screen
- Auto-lock/logout after configurable idle time
- Audit log: every sale, price override, void, and stock edit tagged with user + timestamp

### 3.2 Product & Inventory Management
Two product types in one catalog:

**Jewelry items:**
- Category (ring, chain, bangle, necklace, earring, etc.), metal type (gold/silver/platinum/imitation), purity/karat (24K, 22K, 18K...), gross weight, stone weight, net weight, making charge (fixed AED or % of metal value), wastage %, current metal rate reference, hallmark/certification number, supplier

**Gift items:**
- Simple SKU, name, category, cost price, selling price, stock quantity

**Shared features:**
- **Auto-generate a unique barcode on product creation** (Code128/EAN-13)
- Print barcode labels (barcode + name + price) to a label or thermal printer
- Stock quantity tracking with low-stock alerts
- A daily **gold/silver rate update screen** — since jewelry pricing depends on the day's metal rate, an admin enters today's rate each morning and it's used to auto-calculate item prices where rate-based pricing is enabled

### 3.3 Barcode-Based Checkout
- Scan barcode (via USB scanner, keyboard-emulation — no extra setup) to add item to cart instantly
- Manual product search as a fallback
- Editable line-item price (with permission) for negotiable jewelry pricing
- Item-level and bill-level discounts
- **Old gold exchange / buy-back** as a line-item credit (very common in jewelry retail — worth including even though you didn't list it)
- Auto-calculates 5% VAT on the full item value (metal + making charges, per current FTA rules)
- **Payment channel selector at checkout: Online / Offline** — a simple tag so you can track and report on how each sale's payment came in, separate from the granular payment method:
  - **Offline** → Cash, or Card swiped in person on a standalone card machine
  - **Online** → Bank transfer, online payment link, or payment gateway
  - Cashier picks the channel first, then the specific method; both are saved on the sale so reports can filter/group by either
- Hold/park a sale and resume later
- Auto-prints receipt and **auto-opens the cash drawer** on cash payment
- Returns/exchanges generate a linked credit note referencing the original invoice

### 3.4 Purchase Module
- Record purchases from suppliers (raw material or finished stock)
- Auto-updates stock on purchase entry
- Tracks purchase cost for margin/profit calculation
- Basic supplier ledger (amount owed/paid)
- Purchase returns

### 3.5 Sales History, Reports & Financials
- Full searchable sales history (filter by date range, product, cashier, payment method, payment channel)
- **Month-wise sales filter/report**
- Day-end (Z-report): total sales, VAT collected, breakdown by payment method **and** by online/offline channel, expected vs actual cash in drawer
- Dashboard: revenue, profit margin, top-selling products, slow-moving stock

### 3.6 VAT & Excel Export
- Tax invoice includes all required FTA fields: your TRN, sequential invoice number, date, item description, quantity, unit price, VAT rate/amount, total
- VAT summary report by period, formatted to make FTA VAT return filing straightforward
- **One-click Excel export**: sales register, VAT report, purchase register
- Since this is standard mall-counter retail (not B2B bullion wholesale), the reverse-charge mechanism doesn't apply — every sale is simply 5% VAT on the full invoice value. No need to build that module.
- *You're not required to integrate e-invoicing/ASP yet (B2C is currently out of scope of the mandate) — but keep invoice numbering and TRN fields structured cleanly now so it's a config change, not a rebuild, when the rules extend to retail.*
- **Note:** have your accountant sign off on the final invoice template and VAT report format before go-live — worth a second pair of eyes even for a straightforward retail setup.

### 3.7 UI/UX
- Touch-friendly checkout screen, large tap targets (many UAE POS terminals are touchscreen)
- Bilingual **English + Arabic UI with RTL support** — strongly recommended given the market
- Fast keyboard shortcuts for high-volume cashier actions
- Clean, high-contrast product grid with search/filter

### 3.8 Hardware Integration
- USB or network thermal receipt printer (58mm/80mm)
- Auto cash-drawer open on cash sale, plus a manual "open drawer" button for float/change situations
- USB barcode scanner (plug-and-play, no driver)
- Optional: dedicated barcode label printer for small jewelry tags

### 3.9 Security & Backup
- Since this is offline-only, **local backup strategy is critical** — automated daily backup of the SQLite file to a second location (external drive, another folder, or USB stick), since there's no cloud copy by default
- Consider an encrypted database (e.g., SQLCipher) given this holds high-value transaction data
- Role-based permissions as described in 3.1

---

## 4. High-Level Database Schema

```
users(id, name, username, password_hash, role, created_at)
categories(id, name)
products(id, barcode, name, type[jewelry/gift], category_id, metal_type, purity,
          gross_weight, net_weight, stone_weight, making_charge, wastage_pct,
          cost_price, selling_price, stock_qty, supplier_id, created_at)
metal_rates(id, date, metal_type, purity, rate_per_gram)
customers(id, name, phone, trn [nullable])
sales(id, invoice_no, date, customer_id, payment_channel[online/offline], payment_method,
      cashier_id, subtotal, discount, vat_amount, total, status)
      -- payment_channel: online / offline (for quick tracking/reporting)
      -- payment_method: cash / card / bank_transfer / payment_link / split
sale_items(id, sale_id, product_id, qty, unit_price, discount, vat_amount, line_total,
           is_exchange_item [bool])
payments(id, sale_id, method, amount)
suppliers(id, name, phone, address)
purchases(id, supplier_id, date, invoice_ref, total)
purchase_items(id, purchase_id, product_id, qty, unit_cost)
audit_log(id, user_id, action, table_name, record_id, timestamp)
```

---

## 5. Suggested Build Phases (MVP → Full)

1. **Phase 1 — Core:** Auth/roles, product CRUD + barcode generation, barcode-scan checkout, VAT calculation, receipt printing
2. **Phase 2 — Stock:** Purchase module, supplier tracking, stock movements, low-stock alerts
3. **Phase 3 — Reporting:** Sales history + filters, month-wise reports, VAT report, Excel export
4. **Phase 4 — Retail workflow:** Cash drawer automation, hold/park sale, returns & exchanges, old-gold buy-back
5. **Phase 5 — Polish:** Arabic/RTL UI, automated backups, dashboard, audit log

---

## 6. Ready-to-Use Build Prompt

*Copy the block below into Claude Code (or your developer) to kick off development:*

> Build an offline-first desktop POS application for a standard mall-counter jewelry and gift retail shop in the UAE using Electron, React, and SQLite (better-sqlite3) as the local database. The app must run fully offline with no internet dependency for core operations. Implement: (1) role-based login/logout (Admin/Manager/Cashier) with bcrypt-hashed passwords and an audit log; (2) a product catalog supporting both jewelry items (metal type, purity, weight, making charge, wastage %) and simple gift items (SKU, price, stock), with automatic Code128/EAN-13 barcode generation on product creation and barcode label printing; (3) a barcode-scan checkout flow (USB HID scanner as keyboard input) with editable line pricing, item/bill discounts, old-gold exchange credit, 5% UAE VAT auto-calculation on metal + making charges, and a two-step payment selector: an Online/Offline channel tag first, then the specific method (cash, card, bank transfer, payment link) for reporting purposes; (4) a purchase module updating stock and tracking supplier costs; (5) sales history with date-range and month-wise filters, a day-end Z-report broken down by payment channel and method, and one-click Excel export of sales/VAT/purchase registers formatted for FTA VAT filing; (6) ESC/POS thermal printer integration with auto-print receipts and auto-open cash drawer via the printer's kick-out port; (7) a touch-friendly, bilingual English/Arabic (RTL) UI; (8) automated local database backups. Start with Phase 1 (auth, product/barcode, checkout, VAT, printing) and structure the codebase so later phases can be added incrementally.

---

**Scope confirmed:** standard single-counter jewelry retail (mall-counter style) — no B2B/wholesale, no reverse-charge module needed. Assuming **single terminal, Windows** as the default build target unless you tell your developer otherwise; that's the most common setup for this kind of counter and keeps Phase 1 simple. Multi-terminal syncing can be added later without a rebuild if you ever expand to a second counter.
