import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'

export function HoldSaleModal({ onClose, onHold }: { onClose: () => void; onHold: (note: string | null) => void }) {
  const { t } = useTranslation()
  const [note, setNote] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onHold(note || null)
  }

  return (
    <Modal title={t('checkout.holdSale')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('checkout.holdNote')}
          <input autoFocus className="input mt-1" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('products.cancel')}
          </button>
          <button type="submit" className="btn-primary">
            {t('checkout.holdSale')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
