export type PaymentMethod = 'cash' | 'card'
export type SaleStatus = 'completed' | 'void' | 'held'

export interface CartLineInput {
  productId: number
  qty: number
  /** Price the cashier is charging per unit — may differ from the product's stored selling price. */
  unitPrice: number
  discountAmount: number
  isExchangeItem?: boolean
}

export interface ManagerOverride {
  managerUsername: string
  managerPassword: string
}

export interface FinalizeSaleInput {
  customerId: number | null
  paymentMethod: PaymentMethod
  billDiscountAmount: number
  items: CartLineInput[]
  managerOverride?: ManagerOverride
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  description: string
  qty: number
  unitPrice: number
  discountAmount: number
  vatAmount: number
  lineTotal: number
  isExchangeItem: boolean
}

export interface Sale {
  id: number
  invoiceNo: string
  createdAt: string
  customerId: number | null
  paymentMethod: PaymentMethod
  cashierId: number
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
  status: SaleStatus
}

export interface SaleWithItems extends Sale {
  items: SaleItem[]
}
