import type { SafeUser } from './user'
import type { Category, MetalRate, NewProductInput, Product, UpdateProductInput } from './product'
import type { Customer, NewCustomerInput } from './customer'
import type { FinalizeSaleInput, Sale, SaleWithItems } from './sale'
import type {
  NewSupplierInput,
  NewSupplierPaymentInput,
  Supplier,
  SupplierLedger,
  SupplierPayment,
  UpdateSupplierInput
} from './supplier'
import type {
  NewPurchaseInput,
  NewPurchaseReturnInput,
  Purchase,
  PurchaseReturn,
  PurchaseReturnWithItems,
  PurchaseWithItems,
  StockMovement
} from './purchase'
import type { ExportResult, MonthlySalesSummary, SalesHistoryFilter, VatSummary, ZReport } from './report'
import type { ShopSettings } from './settings'

export const IPC = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CURRENT: 'auth:current',

  PRODUCTS_LIST: 'products:list',
  PRODUCTS_SEARCH: 'products:search',
  PRODUCTS_FIND_BY_BARCODE: 'products:findByBarcode',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DEACTIVATE: 'products:deactivate',
  PRODUCTS_GET_BARCODE_IMAGE: 'products:getBarcodeImage',

  CATEGORIES_LIST: 'categories:list',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',

  METAL_RATES_LIST_LATEST: 'metalRates:listLatest',
  METAL_RATES_UPSERT: 'metalRates:upsert',

  CUSTOMERS_SEARCH: 'customers:search',
  CUSTOMERS_CREATE: 'customers:create',

  SALES_FINALIZE: 'sales:finalize',

  SUPPLIERS_LIST: 'suppliers:list',
  SUPPLIERS_SEARCH: 'suppliers:search',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',
  SUPPLIERS_GET_LEDGER: 'suppliers:getLedger',
  SUPPLIER_PAYMENTS_LIST: 'supplierPayments:list',
  SUPPLIER_PAYMENTS_CREATE: 'supplierPayments:create',

  PURCHASES_LIST: 'purchases:list',
  PURCHASES_GET: 'purchases:get',
  PURCHASES_CREATE: 'purchases:create',
  PURCHASE_RETURNS_LIST: 'purchaseReturns:list',
  PURCHASE_RETURNS_CREATE: 'purchaseReturns:create',

  STOCK_MOVEMENTS_LIST: 'stockMovements:list',

  REPORTS_SALES_HISTORY: 'reports:salesHistory',
  REPORTS_USERS_LIST: 'reports:usersList',
  REPORTS_MONTHLY_SUMMARY: 'reports:monthlySummary',
  REPORTS_VAT_SUMMARY: 'reports:vatSummary',
  REPORTS_Z_REPORT: 'reports:zReport',
  REPORTS_EXPORT_SALES_REGISTER: 'reports:exportSalesRegister',
  REPORTS_EXPORT_VAT_REPORT: 'reports:exportVatReport',
  REPORTS_EXPORT_PURCHASE_REGISTER: 'reports:exportPurchaseRegister',

  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update'
} as const

export interface LoginRequest {
  username: string
  password: string
}

export interface UpsertMetalRateRequest {
  date: string
  metalType: MetalRate['metalType']
  purity: string
  ratePerGram: number
}

export interface NewCategoryRequest {
  name: string
  appliesTo: Category['appliesTo']
}

export interface UpdateCategoryRequest {
  id: number
  name: string
  appliesTo: Category['appliesTo']
}

/** The full typed shape of `window.api`, implemented by the preload script. */
export interface IpcApi {
  auth: {
    login(req: LoginRequest): Promise<SafeUser>
    logout(): Promise<void>
    current(): Promise<SafeUser | null>
  }
  products: {
    list(filter?: { type?: Product['type']; activeOnly?: boolean }): Promise<Product[]>
    search(query: string): Promise<Product[]>
    findByBarcode(barcode: string): Promise<Product | null>
    create(input: NewProductInput): Promise<Product>
    update(input: UpdateProductInput): Promise<Product>
    deactivate(id: number): Promise<void>
    getBarcodeImage(barcode: string): Promise<string>
  }
  categories: {
    list(): Promise<Category[]>
    create(input: NewCategoryRequest): Promise<Category>
    update(input: UpdateCategoryRequest): Promise<Category>
  }
  metalRates: {
    listLatest(): Promise<MetalRate[]>
    upsert(input: UpsertMetalRateRequest): Promise<MetalRate>
  }
  customers: {
    search(query: string): Promise<Customer[]>
    create(input: NewCustomerInput): Promise<Customer>
  }
  sales: {
    finalize(input: FinalizeSaleInput): Promise<SaleWithItems>
  }
  suppliers: {
    list(): Promise<Supplier[]>
    search(query: string): Promise<Supplier[]>
    create(input: NewSupplierInput): Promise<Supplier>
    update(input: UpdateSupplierInput): Promise<Supplier>
    getLedger(supplierId: number): Promise<SupplierLedger>
    listPayments(supplierId: number): Promise<SupplierPayment[]>
    createPayment(input: NewSupplierPaymentInput): Promise<SupplierPayment>
  }
  purchases: {
    list(filter?: { supplierId?: number }): Promise<Purchase[]>
    get(id: number): Promise<PurchaseWithItems | null>
    create(input: NewPurchaseInput): Promise<PurchaseWithItems>
    listReturns(filter?: { purchaseId?: number }): Promise<PurchaseReturn[]>
    createReturn(input: NewPurchaseReturnInput): Promise<PurchaseReturnWithItems>
    listStockMovements(filter?: { productId?: number }): Promise<StockMovement[]>
  }
  reports: {
    salesHistory(filter: SalesHistoryFilter): Promise<Sale[]>
    usersList(): Promise<SafeUser[]>
    monthlySummary(): Promise<MonthlySalesSummary[]>
    vatSummary(dateFrom: string, dateTo: string): Promise<VatSummary>
    zReport(date: string): Promise<ZReport>
    exportSalesRegister(dateFrom: string, dateTo: string): Promise<ExportResult>
    exportVatReport(dateFrom: string, dateTo: string): Promise<ExportResult>
    exportPurchaseRegister(dateFrom: string, dateTo: string): Promise<ExportResult>
  }
  settings: {
    get(): Promise<ShopSettings>
    update(input: ShopSettings): Promise<ShopSettings>
  }
}
