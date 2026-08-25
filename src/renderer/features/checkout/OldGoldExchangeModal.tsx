import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { formatAed } from '../../lib/format'
import { round2 } from '@shared/pricing'

export function OldGoldExchangeModal({
  onClose,
  onAdd
}: {
  onClose: () => void
  onAdd: (description: string, creditAmount: number) => void
}) {
  const { t } = useTranslation()
  const [metalDescription, setMetalDescription] = useState('22K Gold')
  const [weightGrams, setWeightGrams] = useState('')
  const [ratePerGram, setRatePerGram] = useState('')

  const credit = round2((Number(weightGrams) || 0) * (Number(ratePerGram) || 0))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (credit <= 0) return
    const description = `${t('checkout.exchangeCredit')}: ${metalDescription}, ${weightGrams}g @ ${ratePerGram}/g`
    onAdd(description, credit)
  }

  return (
    <Modal title={t('checkout.oldGoldExchange')} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('checkout.metalDescription')}
          <input
            autoFocus
            className="input mt-1"
            value={metalDescription}
            onChange={(e) => setMetalDescription(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">
            {t('checkout.weightGrams')}
            <input
              type="number"
              step="0.001"
              min="0"
              required
              className="input mt-1"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t('checkout.ratePerGram')}
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="input mt-1"
              value={ratePerGram}
              onChange={(e) => setRatePerGram(e.target.value)}
            />
          </label>
        </div>
        <p className="text-sm font-medium text-slate-700">
          {t('checkout.creditAmount')}: <span className="text-amber-700">{formatAed(credit)}</span>
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            {t('products.cancel')}
          </button>
          <button type="submit" disabled={credit <= 0} className="btn-primary">
            {t('checkout.addExchangeCredit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
