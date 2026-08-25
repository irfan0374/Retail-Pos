import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import type { Supplier } from '@shared/types/supplier'

export function SupplierFormModal({
  existing,
  onClose,
  onSaved
}: {
  existing?: Supplier
  onClose: () => void
  onSaved: (supplier: Supplier) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(existing?.name ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const input = { name, phone: phone || null, address: address || null }
      const supplier = existing
        ? await window.api.suppliers.update({ id: existing.id, ...input })
        : await window.api.suppliers.create(input)
      onSaved(supplier)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={existing ? t('suppliers.editSupplier') : t('suppliers.newSupplier')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('suppliers.name')}
          <input
            autoFocus
            required
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('suppliers.phone')}
          <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('suppliers.address')}
          <input className="input mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
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
