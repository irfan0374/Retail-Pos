import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { CASHIER_MAX_DISCOUNT_PCT, EXCHANGE_PLACEHOLDER_SKU } from '@shared/constants'
import { calculateSaleTotals, round2 } from '@shared/pricing'
import { requireSession, verifyManagerPin } from '../services/auth.service'
import { resolveUnitPrice } from '../services/pricing.service'
import { findProductById } from '../db/repositories/products.repo'
import {
  finalizeSale,
  findSaleByInvoiceNo,
  getSaleWithItemsById,
  type FinalizeSaleLine
} from '../db/repositories/sales.repo'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
import { getSettings } from '../db/repositories/settings.repo'
import { getPrinter } from '../services/printer.service'
import type { SafeUser } from '@shared/types/user'
import type { FinalizeSaleInput, SaleWithItems } from '@shared/types/sale'

const finalizeSchema = z.object({
  customerId: z.number().nullable(),
  paymentMethod: z.enum(['cash', 'card']),
  billDiscountAmount: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        productId: z.number(),
        qty: z.number().positive(),
        // Negative for an old-gold exchange credit line, non-negative for a real product line —
        // both enforced in finalizeSaleWithChecks.
        unitPrice: z.number(),
        discountAmount: z.number().nonnegative(),
        isExchangeItem: z.boolean().optional(),
        description: z.string().optional()
      })
    )
    .min(1),
  managerOverride: z.object({ managerPin: z.string().regex(/^\d{4}$/) }).optional()
})

function exceedsCashierLimit(referenceAmount: number, chargedAmount: number): boolean {
  if (referenceAmount <= 0) return false
  return ((referenceAmount - chargedAmount) / referenceAmount) * 100 > CASHIER_MAX_DISCOUNT_PCT
}

/**
 * Server-side recomputation is the only thing that's authoritative — the renderer's
 * disabled/hidden controls are a UX nicety, never trusted here.
 */
export async function finalizeSaleWithChecks(
  cashier: SafeUser,
  input: FinalizeSaleInput
): Promise<SaleWithItems> {
  const overrideReasons = new Set<'discount' | 'payout'>()
  let totalReference = 0
  let totalChargedBeforeBill = 0

  const validated = input.items.map((item) => {
    const product = findProductById(item.productId)
    if (!product) throw new Error(`Product ${item.productId} not found`)
    const isExchangeItem = !!item.isExchangeItem
    const isPlaceholder = product.sku === EXCHANGE_PLACEHOLDER_SKU

    if (isExchangeItem) {
      if (!getSettings().showOldGoldExchange) throw new Error('Old-gold exchange is disabled')
      if (!isPlaceholder) throw new Error('Exchange lines must use the old-gold exchange product')
      if (item.unitPrice >= 0) throw new Error('Exchange credit must be a negative amount')
      if (item.discountAmount !== 0) throw new Error('Exchange lines cannot carry a discount')
    } else {
      if (isPlaceholder) throw new Error('The old-gold exchange product cannot be sold as a normal line')
      if (item.unitPrice < 0) throw new Error(`Negative price on ${product.name}`)

      const gross = item.unitPrice * item.qty
      if (item.discountAmount > gross) throw new Error(`Discount on ${product.name} exceeds the line amount`)

      // Both an edited unit price and a line discount count toward the cashier's limit.
      const reference = resolveUnitPrice(product) * item.qty
      const charged = gross - item.discountAmount
      if (exceedsCashierLimit(reference, charged)) overrideReasons.add('discount')
      totalReference += reference
      totalChargedBeforeBill += charged
    }

    return { item, product, isExchangeItem }
  })

  if (input.billDiscountAmount > round2(totalChargedBeforeBill)) {
    throw new Error('Bill discount exceeds the sale amount')
  }
  // Line and bill discounts stack, so the whole-bill check runs against everything given away.
  if (exceedsCashierLimit(totalReference, totalChargedBeforeBill - input.billDiscountAmount)) {
    overrideReasons.add('discount')
  }

  const totals = calculateSaleTotals(
    validated.map(({ item, isExchangeItem }) => ({
      unitPrice: item.unitPrice,
      qty: item.qty,
      discountAmount: item.discountAmount,
      isExchangeItem
    })),
    input.billDiscountAmount
  )
  // Exchange credit larger than the purchase means cash goes out of the drawer.
  if (totals.total < 0) overrideReasons.add('payout')

  if (overrideReasons.size > 0 && cashier.role === 'cashier') {
    if (!input.managerOverride) {
      throw new Error('Discount or payout exceeds the cashier limit — manager override required')
    }
    const manager = verifyManagerPin(input.managerOverride.managerPin)
    recordAuditLog({
      userId: cashier.id,
      action: 'checkout.discount_override',
      details: {
        approvedBy: manager.id,
        reasons: [...overrideReasons],
        billDiscountAmount: input.billDiscountAmount,
        total: totals.total
      }
    })
  }

  const lines: FinalizeSaleLine[] = validated.map(({ item, product, isExchangeItem }, i) => ({
    productId: product.id,
    description: isExchangeItem && item.description ? item.description : product.name,
    qty: item.qty,
    unitPrice: item.unitPrice,
    // Includes this line's share of the bill discount, so credit notes refund what was paid.
    discountAmount: totals.lines[i].discountAmount,
    vatAmount: totals.lines[i].vatAmount,
    lineTotal: totals.lines[i].lineTotal,
    isExchangeItem
  }))

  const sale = finalizeSale({
    cashierId: cashier.id,
    customerId: input.customerId,
    paymentMethod: input.paymentMethod,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    vatAmount: totals.vatAmount,
    total: totals.total,
    items: lines
  })

  const printer = getPrinter()
  await printer.printReceipt(sale)
  if (input.paymentMethod === 'cash') await printer.openDrawer()

  return sale
}

export async function reprintSale(user: SafeUser, saleId: number): Promise<void> {
  const sale = getSaleWithItemsById(saleId)
  if (!sale) throw new Error(`Sale ${saleId} not found`)
  await getPrinter().printReceipt(sale)
  recordAuditLog({ userId: user.id, action: 'sales.reprint', tableName: 'sales', recordId: sale.id })
}

export function registerSalesHandlers(): void {
  ipcMain.handle(IPC.SALES_FINALIZE, async (_event, payload) => {
    const cashier = requireSession()
    const input = finalizeSchema.parse(payload)
    return finalizeSaleWithChecks(cashier, input)
  })

  ipcMain.handle(IPC.SALES_FIND_BY_INVOICE, (_event, invoiceNo) => {
    requireSession()
    const sale = findSaleByInvoiceNo(z.string().min(1).parse(invoiceNo))
    return sale ? getSaleWithItemsById(sale.id) : null
  })

  ipcMain.handle(IPC.SALES_REPRINT, async (_event, saleId) => {
    const user = requireSession()
    await reprintSale(user, Number(saleId))
  })
}
