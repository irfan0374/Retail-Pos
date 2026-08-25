import type { PaymentMethod } from './sale'

export interface SalesHistoryFilter {
  dateFrom?: string
  dateTo?: string
  cashierId?: number
  paymentMethod?: PaymentMethod
  productId?: number
}

export interface MonthlySalesSummary {
  month: string
  salesCount: number
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
}

export interface VatSummary {
  dateFrom: string
  dateTo: string
  salesCount: number
  taxableAmount: number
  vatAmount: number
  totalAmount: number
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod
  count: number
  total: number
}

export interface ZReport {
  date: string
  salesCount: number
  subtotal: number
  discountAmount: number
  vatAmount: number
  total: number
  byPaymentMethod: PaymentMethodBreakdown[]
  expectedCash: number
}

export interface DateRange {
  dateFrom: string
  dateTo: string
}

export interface ExportResult {
  success: boolean
  filePath?: string
}
