import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types/ipc-contract'
import type { IpcApi } from '@shared/types/ipc-contract'

const api: IpcApi = {
  auth: {
    login: (req) => ipcRenderer.invoke(IPC.AUTH_LOGIN, req),
    logout: () => ipcRenderer.invoke(IPC.AUTH_LOGOUT),
    current: () => ipcRenderer.invoke(IPC.AUTH_CURRENT)
  },
  products: {
    list: (filter) => ipcRenderer.invoke(IPC.PRODUCTS_LIST, filter),
    search: (query) => ipcRenderer.invoke(IPC.PRODUCTS_SEARCH, query),
    findByBarcode: (barcode) => ipcRenderer.invoke(IPC.PRODUCTS_FIND_BY_BARCODE, barcode),
    findBySku: (sku) => ipcRenderer.invoke(IPC.PRODUCTS_FIND_BY_SKU, sku),
    create: (input) => ipcRenderer.invoke(IPC.PRODUCTS_CREATE, input),
    update: (input) => ipcRenderer.invoke(IPC.PRODUCTS_UPDATE, input),
    deactivate: (id) => ipcRenderer.invoke(IPC.PRODUCTS_DEACTIVATE, id),
    getBarcodeImage: (barcode) => ipcRenderer.invoke(IPC.PRODUCTS_GET_BARCODE_IMAGE, barcode)
  },
  categories: {
    list: () => ipcRenderer.invoke(IPC.CATEGORIES_LIST),
    create: (input) => ipcRenderer.invoke(IPC.CATEGORIES_CREATE, input),
    update: (input) => ipcRenderer.invoke(IPC.CATEGORIES_UPDATE, input)
  },
  metalRates: {
    listLatest: () => ipcRenderer.invoke(IPC.METAL_RATES_LIST_LATEST),
    upsert: (input) => ipcRenderer.invoke(IPC.METAL_RATES_UPSERT, input)
  },
  customers: {
    search: (query) => ipcRenderer.invoke(IPC.CUSTOMERS_SEARCH, query),
    create: (input) => ipcRenderer.invoke(IPC.CUSTOMERS_CREATE, input)
  },
  sales: {
    finalize: (input) => ipcRenderer.invoke(IPC.SALES_FINALIZE, input),
    findByInvoice: (invoiceNo) => ipcRenderer.invoke(IPC.SALES_FIND_BY_INVOICE, invoiceNo),
    openDrawer: () => ipcRenderer.invoke(IPC.SALES_OPEN_DRAWER)
  },
  heldSales: {
    list: () => ipcRenderer.invoke(IPC.HELD_SALES_LIST),
    get: (id) => ipcRenderer.invoke(IPC.HELD_SALES_GET, id),
    create: (input) => ipcRenderer.invoke(IPC.HELD_SALES_CREATE, input),
    delete: (id) => ipcRenderer.invoke(IPC.HELD_SALES_DELETE, id)
  },
  creditNotes: {
    list: (filter) => ipcRenderer.invoke(IPC.CREDIT_NOTES_LIST, filter),
    create: (input) => ipcRenderer.invoke(IPC.CREDIT_NOTES_CREATE, input)
  },
  suppliers: {
    list: () => ipcRenderer.invoke(IPC.SUPPLIERS_LIST),
    search: (query) => ipcRenderer.invoke(IPC.SUPPLIERS_SEARCH, query),
    create: (input) => ipcRenderer.invoke(IPC.SUPPLIERS_CREATE, input),
    update: (input) => ipcRenderer.invoke(IPC.SUPPLIERS_UPDATE, input),
    getLedger: (supplierId) => ipcRenderer.invoke(IPC.SUPPLIERS_GET_LEDGER, supplierId),
    listPayments: (supplierId) => ipcRenderer.invoke(IPC.SUPPLIER_PAYMENTS_LIST, supplierId),
    createPayment: (input) => ipcRenderer.invoke(IPC.SUPPLIER_PAYMENTS_CREATE, input)
  },
  purchases: {
    list: (filter) => ipcRenderer.invoke(IPC.PURCHASES_LIST, filter),
    get: (id) => ipcRenderer.invoke(IPC.PURCHASES_GET, id),
    create: (input) => ipcRenderer.invoke(IPC.PURCHASES_CREATE, input),
    listReturns: (filter) => ipcRenderer.invoke(IPC.PURCHASE_RETURNS_LIST, filter),
    createReturn: (input) => ipcRenderer.invoke(IPC.PURCHASE_RETURNS_CREATE, input),
    listStockMovements: (filter) => ipcRenderer.invoke(IPC.STOCK_MOVEMENTS_LIST, filter)
  },
  reports: {
    salesHistory: (filter) => ipcRenderer.invoke(IPC.REPORTS_SALES_HISTORY, filter),
    usersList: () => ipcRenderer.invoke(IPC.REPORTS_USERS_LIST),
    monthlySummary: () => ipcRenderer.invoke(IPC.REPORTS_MONTHLY_SUMMARY),
    vatSummary: (dateFrom, dateTo) => ipcRenderer.invoke(IPC.REPORTS_VAT_SUMMARY, dateFrom, dateTo),
    zReport: (date) => ipcRenderer.invoke(IPC.REPORTS_Z_REPORT, date),
    exportSalesRegister: (dateFrom, dateTo) =>
      ipcRenderer.invoke(IPC.REPORTS_EXPORT_SALES_REGISTER, dateFrom, dateTo),
    exportVatReport: (dateFrom, dateTo) => ipcRenderer.invoke(IPC.REPORTS_EXPORT_VAT_REPORT, dateFrom, dateTo),
    exportPurchaseRegister: (dateFrom, dateTo) =>
      ipcRenderer.invoke(IPC.REPORTS_EXPORT_PURCHASE_REGISTER, dateFrom, dateTo)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
    update: (input) => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, input)
  },
  dashboard: {
    summary: () => ipcRenderer.invoke(IPC.DASHBOARD_SUMMARY),
    topSelling: () => ipcRenderer.invoke(IPC.DASHBOARD_TOP_SELLING),
    slowMoving: () => ipcRenderer.invoke(IPC.DASHBOARD_SLOW_MOVING)
  },
  auditLog: {
    list: (filter) => ipcRenderer.invoke(IPC.AUDIT_LOG_LIST, filter)
  },
  backups: {
    getSettings: () => ipcRenderer.invoke(IPC.BACKUPS_GET_SETTINGS),
    pickDirectory: () => ipcRenderer.invoke(IPC.BACKUPS_PICK_DIRECTORY),
    runNow: () => ipcRenderer.invoke(IPC.BACKUPS_RUN_NOW),
    listFiles: () => ipcRenderer.invoke(IPC.BACKUPS_LIST_FILES)
  }
}

contextBridge.exposeInMainWorld('api', api)
