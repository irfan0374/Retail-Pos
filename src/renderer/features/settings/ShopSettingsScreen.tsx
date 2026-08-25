import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../../store/settingsStore'
import { BackupsSection } from './BackupsSection'
import { ChangePinSection } from './ChangePinSection'
import { AdminResetPinSection } from './AdminResetPinSection'
import type { ShopSettings } from '@shared/types/settings'

const EMPTY: ShopSettings = {
  shopName: '',
  trn: '',
  address: '',
  phone: '',
  idleLogoutMinutes: 5,
  showOldGoldExchange: true,
  showReturns: true,
  showMetalRates: true
}

export function ShopSettingsScreen() {
  const { t } = useTranslation()
  const storeSettings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.load)
  const [form, setForm] = useState<ShopSettings>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (storeSettings) setForm(storeSettings)
  }, [storeSettings])

  function set<K extends keyof ShopSettings>(key: K, value: ShopSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await window.api.settings.update(form)
      await loadSettings()
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
          <input className="input mt-1" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('settings.trn')}
          <input className="input mt-1" value={form.trn} onChange={(e) => set('trn', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('settings.address')}
          <input className="input mt-1" value={form.address} onChange={(e) => set('address', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('settings.phone')}
          <input className="input mt-1" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('settings.idleLogoutMinutes')}
          <input
            type="number"
            min={1}
            max={120}
            className="input mt-1"
            value={form.idleLogoutMinutes}
            onChange={(e) => set('idleLogoutMinutes', Number(e.target.value))}
          />
        </label>

        <div className="border-t border-slate-100 pt-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">
            {t('settings.featureVisibility')}
          </h3>
          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm text-slate-700">
              {t('settings.showOldGoldExchange')}
              <input
                type="checkbox"
                checked={form.showOldGoldExchange}
                onChange={(e) => set('showOldGoldExchange', e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-700">
              {t('settings.showReturns')}
              <input
                type="checkbox"
                checked={form.showReturns}
                onChange={(e) => set('showReturns', e.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-slate-700">
              {t('settings.showMetalRates')}
              <input
                type="checkbox"
                checked={form.showMetalRates}
                onChange={(e) => set('showMetalRates', e.target.checked)}
              />
            </label>
          </div>
        </div>

        {saved && <p className="text-sm text-green-600">{t('settings.saved')}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {t('settings.save')}
        </button>
      </form>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">{t('settings.accountSecurity')}</h2>
      </div>
      <ChangePinSection />
      <AdminResetPinSection />
      <BackupsSection />
    </div>
  )
}
