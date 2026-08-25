import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import { cartTotals, useCartStore } from '../../store/cartStore'

export function OrderSummaryPanel() {
  const { t } = useTranslation()
  const lines = useCartStore((s) => s.lines)
  const billDiscountAmount = useCartStore((s) => s.billDiscountAmount)
  const setBillDiscount = useCartStore((s) => s.setBillDiscount)

  const { subtotal, vatAmount, total } = cartTotals(lines, billDiscountAmount)

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-500">{t('checkout.subtotal')}</span>
        <span>{formatAed(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-500">{t('checkout.billDiscount')}</span>
        <input
          type="number"
          step="0.01"
          value={billDiscountAmount}
          onChange={(e) => setBillDiscount(Number(e.target.value))}
          className="w-24 rounded border border-slate-200 px-2 py-1 text-right"
        />
      </div>
      <div className="flex justify-between">
        <span className="text-slate-500">{t('checkout.vat')}</span>
        <span>{formatAed(vatAmount)}</span>
      </div>
      <div className="my-2 border-t border-dashed border-slate-200" />
      <div className="flex justify-between text-lg font-semibold">
        <span>{t('checkout.total')}</span>
        <span>{formatAed(total)}</span>
      </div>
    </div>
  )
}
