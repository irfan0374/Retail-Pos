# RetailKey POS

Offline-first desktop POS for a jewelry & gift retail shop in the UAE. Electron + React +
TypeScript, with a local SQLite database (`better-sqlite3`) — no internet dependency for daily
operations. See [`jewelry-gift-shop-pos-spec.md`](./jewelry-gift-shop-pos-spec.md) for the full
product spec.

This repo currently implements **Phase 1**: auth/roles, product catalog with barcode generation,
barcode-scan checkout with VAT calculation and discount-override enforcement, and receipt
printing (mocked by default — no hardware required for development).

## Getting started

```bash
npm install
npm run dev
```

On first run, a default admin account is seeded automatically:

- **Username:** `admin`
- **Password:** `admin123`

Change this password before using the app for real — there's no "change password" UI yet
(Phase 1 doesn't include user management beyond the seeded admin).

The SQLite database lives at Electron's `userData` path (e.g.
`~/Library/Application Support/retailkey-pos/retailkey-pos.db` on macOS), separate from the
project folder.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs the app in development with hot reload |
| `npm run build` | Production build (main, preload, renderer) into `out/` |
| `npm run build:win` | Production build + packages a Windows NSIS installer into `release/` |
| `npm run typecheck` | Type-checks main/preload/shared and the renderer separately |
| `npm run lint` | ESLint across the codebase |
| `npm run format` | Prettier — writes formatting fixes |

## Receipt printing: mock vs. real hardware

By default the app uses a `MockPrinter` that logs the formatted receipt to the console and shows
the same data in the on-screen receipt preview — no thermal printer required for development.

To print to a real ESC/POS thermal printer, set these environment variables before starting the
app:

```bash
PRINTER_MODE=escpos PRINTER_INTERFACE=tcp://192.168.1.50 npm run dev   # network printer
PRINTER_MODE=escpos PRINTER_INTERFACE=usb npm run dev                  # USB printer
```

Cash-drawer auto-open is wired into the `IReceiptPrinter` interface but not yet called from the
checkout flow — that lands in Phase 4 alongside hold/park sale and old-gold exchange.

## Architecture notes

- **IPC**: typed RPC via `shared/types/ipc-contract.ts` — the renderer never touches `ipcRenderer`
  directly, only a typed `window.api`. Every main-process handler independently re-validates input
  and re-checks the caller's role (`main/permissions.ts`); renderer-side `RoleGate` hiding is
  cosmetic only.
- **Pricing/VAT**: pure calculation functions live in `shared/pricing.ts` so the renderer can show
  a live preview, but the server (`main/ipc/sales.handlers.ts`) always recomputes independently at
  finalize time and is the only source of truth for what actually gets charged.
- **Migrations**: `main/db/migrate.ts` runs ordered `.sql` files (imported as raw strings) tracked
  in a `schema_migrations` table. Add new migrations by creating a new file under
  `main/db/migrations/` and registering it in the `MIGRATIONS` array — never edit an already-shipped
  migration.
- **Native modules**: `better-sqlite3` ships N-API prebuilds for every target platform, so
  `electron-builder.yml` sets `npmRebuild: false` — the automatic native-module rebuild step is
  both unnecessary and (in this specific project path, which contains a space) broken by a
  long-standing `node-gyp` limitation.

## Phase roadmap

1. **Core (this repo)** — auth/roles, product CRUD + barcode generation, barcode-scan checkout,
   VAT calculation, receipt printing.
2. **Stock** — purchase module, supplier tracking, stock movements, low-stock alerts.
3. **Reporting** — sales history + filters, month-wise reports, VAT report, Excel export.
4. **Retail workflow** — cash-drawer automation, hold/park sale, returns & exchanges, old-gold
   buy-back. (Schema already reserves `sales.status='held'` and `sale_items.is_exchange_item` for
   this so no migration is needed when it lands.)
5. **Polish** — Arabic/RTL UI (English-only `t()` scaffolding is already in place via
   `react-i18next`), automated backups, dashboard, audit log UI.
