import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { getLanguage, setLanguage, type AppLanguage } from '../../i18n'
import { PinPad } from '../../components/PinPad'

export function LoginScreen() {
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [language, setLanguageState] = useState<AppLanguage>(getLanguage())

  function toggleLanguage() {
    const next = language === 'en' ? 'ar' : 'en'
    setLanguage(next)
    setLanguageState(next)
  }

  async function handlePin(pin: string) {
    setSubmitting(true)
    setError(null)
    try {
      await login(pin)
    } catch {
      setError(t('auth.loginError'))
      setAttempt((a) => a + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <div className="w-80 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t('app.title')}</h1>
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <p className="mb-4 text-center text-sm text-slate-500">{t('auth.enterPin')}</p>

        <div className="flex justify-center">
          <PinPad key={attempt} onComplete={(pin) => void handlePin(pin)} disabled={submitting} />
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
