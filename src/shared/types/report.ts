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
  creditNoteCount: number
  creditNoteTotal: number
  /** Net of credit notes issued in the period. */
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
  refundCount: number
  refundTotal: number
  /** Cash sales minus cash refunds (credit notes against cash sales) for the day. */
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

export interface DashboardSummary {
  revenueToday: number
  revenueThisMonth: number
  /** (revenue - cost) / revenue, using each sale line's product's *current* cost price — an
   *  approximation, since cost price isn't snapshotted per sale line. */
  marginThisMonthPct: number
}

export interface TopSellingProduct {
  productId: number
  productName: string
  qtySold: number
  revenue: number
}

export interface SlowMovingProduct {
  productId: number
  productName: string
  stockQty: number
  lastSoldAt: string | null
}
