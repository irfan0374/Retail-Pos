import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import type { SupplierPayment } from '@shared/types/supplier'

export function SupplierPaymentModal({
  supplierId,
  onClose,
  onSaved
}: {
  supplierId: number
  onClose: () => void
  onSaved: (payment: SupplierPayment) => void
}) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payment = await window.api.suppliers.createPayment({
        supplierId,
        amount: Number(amount),
        method: method || null,
        note: note || null
      })
      onSaved(payment)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('suppliers.recordPayment')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('suppliers.amount')}
          <input
            autoFocus
            required
            type="number"
            step="0.01"
            min="0.01"
            className="input mt-1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('suppliers.method')}
          <input className="input mt-1" value={method} onChange={(e) => setMethod(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('suppliers.note')}
          <input className="input mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('products.cancel')}
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {t('products.save')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
