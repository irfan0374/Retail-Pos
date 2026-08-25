import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { formatAed } from '../../lib/format'
import type { SaleWithItems } from '@shared/types/sale'

export function ReceiptPreview({ sale, onClose }: { sale: SaleWithItems; onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <Modal title={`${t('checkout.receipt')} — ${sale.invoiceNo}`} onClose={onClose}>
      <div className="space-y-1 text-sm">
        {sale.items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>
              {item.description} × {item.qty}
            </span>
            <span>{formatAed(item.lineTotal)}</span>
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-slate-300" />
        <div className="flex justify-between">
          <span>{t('checkout.subtotal')}</span>
          <span>{formatAed(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('checkout.billDiscount')}</span>
          <span>{formatAed(sale.discountAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('checkout.vat')}</span>
          <span>{formatAed(sale.vatAmount)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>{t('checkout.total')}</span>
          <span>{formatAed(sale.total)}</span>
        </div>
        <p className="pt-2 text-xs text-slate-400">{sale.paymentMethod}</p>
      </div>
      <button onClick={onClose} className="btn-primary mt-4 w-full">
        OK
      </button>
    </Modal>
  )
}
