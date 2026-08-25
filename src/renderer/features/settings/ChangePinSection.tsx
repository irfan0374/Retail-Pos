import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

function isFourDigits(value: string): boolean {
  return /^\d{4}$/.test(value)
}

export function ChangePinSection() {
  const { t } = useTranslation()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!isFourDigits(currentPin) || !isFourDigits(newPin) || !isFourDigits(confirmPin)) {
      setError('PIN must be 4 digits')
      return
    }
    if (newPin !== confirmPin) {
      setError(t('auth.pinMismatch'))
      return
    }

    setSaving(true)
    try {
      await window.api.auth.changeOwnPin({ currentPin, newPin })
      setMessage(t('auth.pinChanged'))
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700">{t('auth.changePin')}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.currentPin')}
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input mt-1"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.newPin')}
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input mt-1"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.confirmPin')}
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input mt-1"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
          />
        </label>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {t('auth.changePin')}
        </button>
      </form>
    </div>
  )
}
