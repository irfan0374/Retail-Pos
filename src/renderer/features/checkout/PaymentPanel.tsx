import { useTranslation } from 'react-i18next'
import type { PaymentChannel, PaymentMethod } from '@shared/types/sale'

const METHODS_BY_CHANNEL: Record<PaymentChannel, PaymentMethod[]> = {
  offline: ['cash', 'card'],
  online: ['bank_transfer', 'payment_link']
}

export function PaymentPanel({
  channel,
  method,
  onChannelChange,
  onMethodChange
}: {
  channel: PaymentChannel
  method: PaymentMethod
  onChannelChange: (channel: PaymentChannel) => void
  onMethodChange: (method: PaymentMethod) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{t('checkout.paymentChannel')}</p>
      <div className="mb-4 flex gap-2">
        {(['offline', 'online'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              onChannelChange(c)
              onMethodChange(METHODS_BY_CHANNEL[c][0])
            }}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              channel === c ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600'
            }`}
          >
            {t(`checkout.${c}`)}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{t('checkout.paymentMethod')}</p>
      <div className="flex gap-2">
        {METHODS_BY_CHANNEL[channel].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMethodChange(m)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
              method === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600'
            }`}
          >
            {t(`checkout.${toCamel(m)}`)}
          </button>
        ))}
      </div>
    </div>
  )
}

function toCamel(method: PaymentMethod): string {
  return method.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}
