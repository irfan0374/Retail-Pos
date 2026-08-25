import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { getLanguage, setLanguage, type AppLanguage } from '../../i18n'

export function LoginScreen() {
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [language, setLanguageState] = useState<AppLanguage>(getLanguage())

  function toggleLanguage() {
    const next = language === 'en' ? 'ar' : 'en'
    setLanguage(next)
    setLanguageState(next)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(username, password)
    } catch {
      setError(t('auth.loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-80 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
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
        <label className="mb-3 block text-sm font-medium text-slate-700">
          {t('auth.username')}
          <input
            autoFocus
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label className="mb-4 block text-sm font-medium text-slate-700">
          {t('auth.password')}
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? t('auth.loggingIn') : t('auth.login')}
        </button>
      </form>
    </div>
  )
}
