import { Fragment, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import { PurchaseReturnModal } from './PurchaseReturnModal'
import type { Product } from '@shared/types/product'
import type { Purchase, PurchaseWithItems } from '@shared/types/purchase'
import type { Supplier } from '@shared/types/supplier'

export function PurchaseHistoryScreen() {
  const { t } = useTranslation()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliersById, setSuppliersById] = useState<Record<number, Supplier>>({})
  const [productsById, setProductsById] = useState<Record<number, Product>>({})
  const [expanded, setExpanded] = useState<Record<number, PurchaseWithItems>>({})
  const [returningPurchase, setReturningPurchase] = useState<PurchaseWithItems | null>(null)

  const load = useCallback(async () => {
    const [purchaseList, supplierList, productList] = await Promise.all([
      window.api.purchases.list(),
      window.api.suppliers.list(),
      window.api.products.list()
    ])
    setPurchases(purchaseList)
    setSuppliersById(Object.fromEntries(supplierList.map((s) => [s.id, s])))
    setProductsById(Object.fromEntries(productList.map((p) => [p.id, p])))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleExpand(purchase: Purchase) {
    if (expanded[purchase.id]) {
      setExpanded((prev) => {
        const next = { ...prev }
        delete next[purchase.id]
        return next
      })
      return
    }
    const full = await window.api.purchases.get(purchase.id)
    if (full) setExpanded((prev) => ({ ...prev, [purchase.id]: full }))
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('purchases.date')}</th>
              <th className="px-4 py-2">{t('purchases.supplier')}</th>
              <th className="px-4 py-2">{t('purchases.invoiceRef')}</th>
              <th className="px-4 py-2">{t('purchases.total')}</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((p) => (
              <Fragment key={p.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-500">{p.date}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {suppliersById[p.supplierId]?.name ?? `#${p.supplierId}`}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{p.invoiceRef ?? '—'}</td>
                  <td className="px-4 py-2">{formatAed(p.total)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => void toggleExpand(p)}
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      {expanded[p.id] ? '−' : t('purchases.items')}
                    </button>
                  </td>
                </tr>
                {expanded[p.id] && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50 px-4 py-3">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-200">
                          {expanded[p.id].items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1">
                                {productsById[item.productId]?.name ?? `#${item.productId}`}
                              </td>
                              <td className="py-1 text-slate-500">
                                {item.qty} × {formatAed(item.unitCost)}
                              </td>
                              <td className="py-1 text-right">{formatAed(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => setReturningPurchase(expanded[p.id])}
                          className="text-sm font-medium text-red-500 hover:text-red-700"
                        >
                          {t('purchases.return')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  {t('purchases.noPurchases')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {returningPurchase && (
        <PurchaseReturnModal
          purchase={returningPurchase}
          productsById={productsById}
          onClose={() => setReturningPurchase(null)}
          onSaved={() => {
            setReturningPurchase(null)
            void load()
          }}
        />
      )}
    </div>
  )
}
