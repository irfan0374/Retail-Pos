import type { SafeUser } from './user'
import type { Category, MetalRate, NewProductInput, Product, UpdateProductInput } from './product'
import type { Customer, NewCustomerInput } from './customer'
import type { FinalizeSaleInput, SaleWithItems } from './sale'

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

  METAL_RATES_LIST_LATEST: 'metalRates:listLatest',
  METAL_RATES_UPSERT: 'metalRates:upsert',

  CUSTOMERS_SEARCH: 'customers:search',
  CUSTOMERS_CREATE: 'customers:create',

  SALES_FINALIZE: 'sales:finalize'
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
}
