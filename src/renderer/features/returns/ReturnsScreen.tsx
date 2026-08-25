import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed } from '../../lib/format'
import type { SaleWithItems } from '@shared/types/sale'
import type { CreditNoteWithItems } from '@shared/types/creditNote'

export function ReturnsScreen() {
  const { t } = useTranslation()
  const [invoiceNo, setInvoiceNo] = useState('')
  const [sale, setSale] = useState<SaleWithItems | null>(null)
  const [returnQty, setReturnQty] = useState<Record<number, number>>({})
  const [reason, setReason] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [creditNote, setCreditNote] = useState<CreditNoteWithItems | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    setSearchError(null)
    setCreditNote(null)
    const found = await window.api.sales.findByInvoice(invoiceNo.trim())
    if (!found) {
      setSale(null)
      setSearchError(`No sale found for invoice "${invoiceNo.trim()}"`)
      return
    }
    setSale(found)
    setReturnQty({})
    setReason('')
  }

  async function handleSubmit() {
    if (!sale) return
    const items = sale.items
      .filter((item) => !item.isExchangeItem && (returnQty[item.id] ?? 0) > 0)
      .map((item) => ({ saleItemId: item.id, qty: returnQty[item.id] }))
    if (items.length === 0) return

    setSaving(true)
    setSubmitError(null)
    try {
      const result = await window.api.creditNotes.create({ saleId: sale.id, reason: reason || null, items })
      setCreditNote(result)
      setSale(null)
      setInvoiceNo('')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">{t('returns.title')}</h1>

      <form onSubmit={handleSearch} className="mb-4 flex items-end gap-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('returns.invoiceNo')}
          <input
            autoFocus
            className="input mt-1"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary">
          {t('returns.search')}
        </button>
      </form>

      {searchError && <p className="mb-4 text-sm text-red-600">{searchError}</p>}

      {creditNote && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-semibold text-green-800">
            {t('returns.creditNoteIssued')}: {creditNote.creditNoteNo}
          </p>
          <p className="text-green-700">{t('returns.creditTotal')}: {formatAed(creditNote.total)}</p>
        </div>
      )}

      {sale && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Sold Qty</th>
                  <th className="px-4 py-2">{t('returns.returnQty')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      {item.description}
                      {item.isExchangeItem && (
                        <span className="ml-2 text-xs text-slate-400">({t('returns.notReturnable')})</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{item.qty}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        max={item.qty}
                        step="0.001"
                        disabled={item.isExchangeItem}
                        value={returnQty[item.id] ?? 0}
                        onChange={(e) =>
                          setReturnQty((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                        }
                        className="w-20 rounded border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            {t('returns.reason')}
            <input className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}

          <button onClick={() => void handleSubmit()} disabled={saving} className="btn-primary">
            {t('returns.issueCreditNote')}
          </button>
        </div>
      )}
    </div>
  )
}
