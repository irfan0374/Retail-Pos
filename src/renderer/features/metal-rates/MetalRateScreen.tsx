import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAed, localDateIso } from '../../lib/format'
import type { MetalRate, MetalType } from '@shared/types/product'

const METAL_TYPES: MetalType[] = ['gold', 'silver', 'platinum', 'imitation']

export function MetalRateScreen() {
  const { t } = useTranslation()
  const [rates, setRates] = useState<MetalRate[]>([])
  const [metalType, setMetalType] = useState<MetalType>('gold')
  const [purity, setPurity] = useState('22K')
  const [ratePerGram, setRatePerGram] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setRates(await window.api.metalRates.listLatest())
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await window.api.metalRates.upsert({
        date: localDateIso(),
        metalType,
        purity,
        ratePerGram: Number(ratePerGram)
      })
      setRatePerGram('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">{t('metalRates.title')}</h1>

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('metalRates.metalType')}
          <select className="input mt-1" value={metalType} onChange={(e) => setMetalType(e.target.value as MetalType)}>
            {METAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('metalRates.purity')}
          <input className="input mt-1" value={purity} onChange={(e) => setPurity(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('metalRates.ratePerGram')}
          <input
            type="number"
            step="0.01"
            required
            className="input mt-1"
            value={ratePerGram}
            onChange={(e) => setRatePerGram(e.target.value)}
          />
        </label>
        <div className="col-span-3 flex items-center justify-between">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary ml-auto">
            {t('metalRates.save')}
          </button>
        </div>
      </form>

      <h2 className="mb-2 text-sm font-medium text-slate-500">{t('metalRates.latestRates')}</h2>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">{t('metalRates.metalType')}</th>
              <th className="px-4 py-2">{t('metalRates.purity')}</th>
              <th className="px-4 py-2">{t('metalRates.ratePerGram')}</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rates.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 capitalize">{r.metalType}</td>
                <td className="px-4 py-2">{r.purity}</td>
                <td className="px-4 py-2">{formatAed(r.ratePerGram)}</td>
                <td className="px-4 py-2 text-slate-500">{r.date}</td>
              </tr>
            ))}
            {rates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  —
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
