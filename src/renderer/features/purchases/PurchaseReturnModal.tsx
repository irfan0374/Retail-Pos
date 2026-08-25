import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { formatAed } from '../../lib/format'
import type { Product } from '@shared/types/product'
import type { PurchaseWithItems } from '@shared/types/purchase'

export function PurchaseReturnModal({
  purchase,
  productsById,
  onClose,
  onSaved
}: {
  purchase: PurchaseWithItems
  productsById: Record<number, Product>
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [returnQty, setReturnQty] = useState<Record<number, number>>({})
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const items = purchase.items
      .filter((item) => (returnQty[item.id] ?? 0) > 0)
      .map((item) => ({
        purchaseItemId: item.id,
        productId: item.productId,
        qty: returnQty[item.id],
        unitCost: item.unitCost
      }))
    if (items.length === 0) return

    setSaving(true)
    setError(null)
    try {
      await window.api.purchases.createReturn({ purchaseId: purchase.id, reason: reason || null, items })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('purchases.returnItems')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Purchased</th>
                <th className="px-3 py-2">{t('purchases.qty')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{productsById[item.productId]?.name ?? `#${item.productId}`}</td>
                  <td className="px-3 py-2 text-slate-500">{item.qty}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={item.qty}
                      step="0.001"
                      value={returnQty[item.id] ?? 0}
                      onChange={(e) =>
                        setReturnQty((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                      }
                      className="w-20 rounded border border-slate-200 px-2 py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          {t('purchases.reason')}
          <input className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>

        <p className="text-sm text-slate-500">
          {t('purchases.total')}:{' '}
          {formatAed(
            purchase.items.reduce((sum, item) => sum + (returnQty[item.id] ?? 0) * item.unitCost, 0)
          )}
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('products.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {t('purchases.submitReturn')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
