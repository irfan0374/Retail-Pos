import { useTranslation } from 'react-i18next'
import type { PaymentMethod } from '@shared/types/sale'

const METHODS: PaymentMethod[] = ['cash', 'card']

export function PaymentPanel({
  method,
  onMethodChange
}: {
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{t('checkout.paymentMethod')}</p>
      <div className="grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMethodChange(m)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              method === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600'
            }`}
          >
            {t(`checkout.${m}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
