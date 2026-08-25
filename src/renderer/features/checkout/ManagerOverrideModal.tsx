import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import type { ManagerOverride } from '@shared/types/sale'

export function ManagerOverrideModal({
  onCancel,
  onApprove
}: {
  onCancel: () => void
  onApprove: (override: ManagerOverride) => void
}) {
  const { t } = useTranslation()
  const [managerUsername, setManagerUsername] = useState('')
  const [managerPassword, setManagerPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onApprove({ managerUsername, managerPassword })
  }

  return (
    <Modal title={t('checkout.managerOverride')} onClose={onCancel}>
      <p className="mb-4 text-sm text-amber-700">{t('checkout.managerOverrideRequired')}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('checkout.managerUsername')}
          <input
            autoFocus
            className="input mt-1"
            value={managerUsername}
            onChange={(e) => setManagerUsername(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('checkout.managerPassword')}
          <input
            type="password"
            className="input mt-1"
            value={managerPassword}
            onChange={(e) => setManagerPassword(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t('products.cancel')}
          </button>
          <button type="submit" className="btn-primary">
            {t('checkout.approve')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
