import { ipcMain } from 'electron'
import { z } from 'zod'
import { IPC } from '@shared/types/ipc-contract'
import { CASHIER_MAX_DISCOUNT_PCT } from '@shared/constants'
import { calculateLineTotals, impliedDiscountPct, round2 } from '@shared/pricing'
import { requireSession, verifyManagerCredentials } from '../services/auth.service'
import { resolveUnitPrice } from '../services/pricing.service'
import { findProductById } from '../db/repositories/products.repo'
import { finalizeSale, type FinalizeSaleLine } from '../db/repositories/sales.repo'
import { recordAuditLog } from '../db/repositories/auditLog.repo'
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
        unitPrice: z.number().nonnegative(),
        discountAmount: z.number().nonnegative(),
        isExchangeItem: z.boolean().optional()
      })
    )
    .min(1),
  managerOverride: z
    .object({ managerUsername: z.string().min(1), managerPassword: z.string().min(1) })
    .optional()
})

/**
 * Server-side recomputation is the only thing that's authoritative — the renderer's
 * disabled/hidden controls are a UX nicety, never trusted here.
 */
export async function finalizeSaleWithChecks(
  cashier: SafeUser,
  input: FinalizeSaleInput
): Promise<SaleWithItems> {
  let discountExceedsLimit = false

  const lines: FinalizeSaleLine[] = input.items.map((item) => {
    const product = findProductById(item.productId)
    if (!product) throw new Error(`Product ${item.productId} not found`)

    if (!item.isExchangeItem) {
      const referencePrice = resolveUnitPrice(product)
      const pct = impliedDiscountPct(referencePrice, item.unitPrice)
      if (pct > CASHIER_MAX_DISCOUNT_PCT) discountExceedsLimit = true
    }

    const { vatAmount, lineTotal } = calculateLineTotals(item.unitPrice, item.qty, item.discountAmount)
    return {
      productId: product.id,
      description: product.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      vatAmount,
      lineTotal,
      isExchangeItem: !!item.isExchangeItem
    }
  })

  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0))
  const billDiscountPct = subtotal > 0 ? (input.billDiscountAmount / subtotal) * 100 : 0
  if (billDiscountPct > CASHIER_MAX_DISCOUNT_PCT) discountExceedsLimit = true

  if (discountExceedsLimit && cashier.role === 'cashier') {
    if (!input.managerOverride) {
      throw new Error('Discount exceeds the cashier limit — manager override required')
    }
    const manager = verifyManagerCredentials(
      input.managerOverride.managerUsername,
      input.managerOverride.managerPassword
    )
    recordAuditLog({
      userId: cashier.id,
      action: 'checkout.discount_override',
      details: { approvedBy: manager.id, billDiscountPct: round2(billDiscountPct) }
    })
  }

  const vatAmount = round2(lines.reduce((sum, l) => sum + l.vatAmount, 0))
  const linesTotalAfterDiscount = round2(
    lines.reduce((sum, l) => sum + l.unitPrice * l.qty - l.discountAmount, 0)
  )
  const total = round2(linesTotalAfterDiscount - input.billDiscountAmount + vatAmount)

  // Bill-level discount is applied evenly at the sale level; individual line discounts already
  // reduced each line's taxable amount above.
  const sale = finalizeSale({
    cashierId: cashier.id,
    customerId: input.customerId,
    paymentMethod: input.paymentMethod,
    subtotal,
    discountAmount: round2(input.billDiscountAmount + lines.reduce((sum, l) => sum + l.discountAmount, 0)),
    vatAmount,
    total,
    items: lines
  })

  await getPrinter().printReceipt(sale)
  return sale
}

export function registerSalesHandlers(): void {
  ipcMain.handle(IPC.SALES_FINALIZE, async (_event, payload) => {
    const cashier = requireSession()
    const input = finalizeSchema.parse(payload)
    return finalizeSaleWithChecks(cashier, input)
  })
}
