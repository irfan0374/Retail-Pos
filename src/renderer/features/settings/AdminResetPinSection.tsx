import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { SafeUser } from '@shared/types/user'

function isFourDigits(value: string): boolean {
  return /^\d{4}$/.test(value)
}

export function AdminResetPinSection() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<SafeUser[]>([])
  const [userId, setUserId] = useState<number | null>(null)
  const [newPin, setNewPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void window.api.reports.usersList().then(setUsers)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!userId || !isFourDigits(newPin)) {
      setError('PIN must be 4 digits')
      return
    }
    setSaving(true)
    try {
      await window.api.users.resetPin({ userId, newPin })
      setMessage(t('auth.pinReset'))
      setNewPin('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-700">{t('settings.resetUserPin')}</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.selectUser')}
          <select
            className="input mt-1"
            value={userId ?? ''}
            onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('auth.selectUser')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
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
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary">
          {t('auth.resetPin')}
        </button>
      </form>
    </div>
  )
}
