import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { Product } from '@shared/types/product'

export function ScanInput({ onResolved }: { onResolved: (product: Product) => void }) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      void window.api.products.search(value.trim()).then(setResults)
    }, 200)
    return () => clearTimeout(handle)
  }, [value])

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !value.trim()) return
    setError(null)
    const product = await window.api.products.findByBarcode(value.trim())
    if (product) {
      select(product)
    } else {
      setError(`No product found for "${value.trim()}"`)
    }
  }

  function select(product: Product) {
    onResolved(product)
    setValue('')
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => void handleKeyDown(e)}
        placeholder={t('checkout.scanPrompt')}
        className="w-full rounded-md border border-slate-300 px-4 py-3 text-lg"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => select(p)}
                className="flex w-full justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>{p.name}</span>
                <span className="font-mono text-xs text-slate-400">{p.barcode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
