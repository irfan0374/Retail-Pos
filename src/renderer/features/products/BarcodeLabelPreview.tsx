import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../components/Modal'
import { formatAed } from '../../lib/format'
import type { Product } from '@shared/types/product'

export function BarcodeLabelPreview({ product, onClose }: { product: Product; onClose: () => void }) {
  const { t } = useTranslation()
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.api.products.getBarcodeImage(product.barcode).then((url) => {
      if (!cancelled) setImageDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [product.barcode])

  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="flex flex-col items-center gap-3">
        <div id="barcode-label" className="flex w-56 flex-col items-center gap-1 border border-slate-200 p-4">
          <span className="text-sm font-medium">{product.name}</span>
          {imageDataUrl && <img src={imageDataUrl} alt={product.barcode} className="w-full" />}
          <span className="text-sm font-semibold">{formatAed(product.sellingPrice)}</span>
        </div>
        <button onClick={() => window.print()} className="btn-primary print:hidden">
          {t('products.printLabel')}
        </button>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #barcode-label, #barcode-label * { visibility: visible; }
          #barcode-label { position: fixed; top: 0; left: 0; }
        }
      `}</style>
    </Modal>
  )
}
