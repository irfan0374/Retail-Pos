import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { PinPad } from '../../components/PinPad'
import type { ManagerOverride } from '@shared/types/sale'

export function ManagerOverrideModal({
  onCancel,
  onApprove
}: {
  onCancel: () => void
  onApprove: (override: ManagerOverride) => void
}) {
  const { t } = useTranslation()
  const [attempt, setAttempt] = useState(0)

  function handlePin(pin: string) {
    setAttempt((a) => a + 1)
    onApprove({ managerPin: pin })
  }

  return (
    <Modal title={t('checkout.managerOverride')} onClose={onCancel}>
      <p className="mb-4 text-center text-sm text-amber-700">{t('checkout.managerOverrideRequired')}</p>
      <p className="mb-4 text-center text-sm font-medium text-slate-700">{t('checkout.managerPin')}</p>
      <div className="flex justify-center">
        <PinPad key={attempt} onComplete={handlePin} />
      </div>
      <div className="mt-4 flex justify-center">
        <button type="button" onClick={onCancel} className="btn-secondary">
          {t('products.cancel')}
        </button>
      </div>
    </Modal>
  )
}
