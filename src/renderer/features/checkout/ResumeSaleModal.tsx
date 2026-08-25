import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import type { HeldSale, HeldSaleWithItems } from '@shared/types/heldSale'

export function ResumeSaleModal({
  onClose,
  onResume
}: {
  onClose: () => void
  onResume: (heldSale: HeldSaleWithItems) => void
}) {
  const { t } = useTranslation()
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])

  useEffect(() => {
    void window.api.heldSales.list().then(setHeldSales)
  }, [])

  async function handleResume(id: number) {
    const full = await window.api.heldSales.get(id)
    if (!full) return
    await window.api.heldSales.delete(id)
    onResume(full)
  }

  return (
    <Modal title={t('checkout.resumeSale')} onClose={onClose}>
      <div className="max-h-80 overflow-auto">
        {heldSales.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">{t('checkout.noHeldSales')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {heldSales.map((h) => (
              <li key={h.id}>
                <button
                  onClick={() => void handleResume(h.id)}
                  className="flex w-full items-center justify-between px-2 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <span>{h.note || `#${h.id}`}</span>
                  <span className="text-xs text-slate-400">{h.createdAt}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
