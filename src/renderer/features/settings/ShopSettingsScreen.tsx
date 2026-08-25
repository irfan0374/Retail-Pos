import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ShopSettings } from '@shared/types/settings'

export function ShopSettingsScreen() {
  const { t } = useTranslation()
  const [shopName, setShopName] = useState('')
  const [trn, setTrn] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void window.api.settings.get().then((settings: ShopSettings) => {
      setShopName(settings.shopName)
      setTrn(settings.trn)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await window.api.settings.update({ shopName, trn })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-xl font-semibold">{t('settings.title')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">
          {t('settings.shopName')}
          <input className="input mt-1" value={shopName} onChange={(e) => setShopName(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('settings.trn')}
          <input className="input mt-1" value={trn} onChange={(e) => setTrn(e.target.value)} />
        </label>
        {saved && <p className="text-sm text-green-600">{t('settings.saved')}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {t('settings.save')}
        </button>
      </form>
    </div>
  )
}
