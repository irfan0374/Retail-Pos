import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import { cartTotals, useCartStore } from '../../store/cartStore'

export function CartPanel() {
  const { t } = useTranslation()
  const lines = useCartStore((s) => s.lines)
  const billDiscountAmount = useCartStore((s) => s.billDiscountAmount)
  const updateLine = useCartStore((s) => s.updateLine)
  const removeLine = useCartStore((s) => s.removeLine)
  const setBillDiscount = useCartStore((s) => s.setBillDiscount)

  const { subtotal, vatAmount, total } = cartTotals(lines, billDiscountAmount)

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">{t('checkout.cart')}</h2>

      <div className="flex-1 overflow-auto">
        {lines.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">{t('checkout.empty')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-2 py-2">{t('checkout.qty')}</th>
                <th className="px-2 py-2">{t('checkout.unitPrice')}</th>
                <th className="px-2 py-2">{t('checkout.lineDiscount')}</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => (
                <tr key={line.key} className={line.isExchangeItem ? 'bg-amber-50' : undefined}>
                  <td className="px-4 py-2">
                    {line.description ?? line.product.name}
                    {line.isExchangeItem && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {t('checkout.exchangeCredit')}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min={0.001}
                      step="0.001"
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: Number(e.target.value) })}
                      className="w-16 rounded border border-slate-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.key, { unitPrice: Number(e.target.value) })}
                      className="w-24 rounded border border-slate-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={line.discountAmount}
                      onChange={(e) => updateLine(line.key, { discountAmount: Number(e.target.value) })}
                      className="w-20 rounded border border-slate-200 px-2 py-1"
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button onClick={() => removeLine(line.key)} className="text-slate-400 hover:text-red-600">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="space-y-1.5 border-t border-slate-200 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span>{t('checkout.subtotal')}</span>
          <span>{formatAed(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>{t('checkout.billDiscount')}</span>
          <input
            type="number"
            step="0.01"
            value={billDiscountAmount}
            onChange={(e) => setBillDiscount(Number(e.target.value))}
            className="w-24 rounded border border-slate-200 px-2 py-1 text-right"
          />
        </div>
        <div className="flex justify-between">
          <span>{t('checkout.vat')}</span>
          <span>{formatAed(vatAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>{t('checkout.total')}</span>
          <span>{formatAed(total)}</span>
        </div>
      </div>
    </div>
  )
}
