import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { can, IDLE_LOGOUT_MS } from '@shared/constants'
import { useAuthStore } from '../store/authStore'

export type Screen = 'checkout' | 'products' | 'metalRates' | 'purchases' | 'reports' | 'settings'

interface Props {
  screen: Screen
  onNavigate: (screen: Screen) => void
  children: ReactNode
}

export function AppShell({ screen, onNavigate, children }: Props) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function resetIdleTimer() {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => void logout(), IDLE_LOGOUT_MS)
    }
    resetIdleTimer()
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('keydown', resetIdleTimer)
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('keydown', resetIdleTimer)
    }
  }, [logout])

  const navItems: { screen: Screen; label: string }[] = [
    { screen: 'checkout', label: t('nav.checkout') },
    { screen: 'products', label: t('nav.products') },
    ...(user && can(user.role, 'metalRates.write')
      ? [{ screen: 'metalRates' as const, label: t('nav.metalRates') }]
      : []),
    ...(user && can(user.role, 'purchases.read')
      ? [{ screen: 'purchases' as const, label: t('nav.purchases') }]
      : []),
    ...(user && can(user.role, 'reports.financial')
      ? [{ screen: 'reports' as const, label: t('nav.reports') }]
      : []),
    ...(user && can(user.role, 'settings.write')
      ? [{ screen: 'settings' as const, label: t('nav.settings') }]
      : [])
  ]

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">{t('app.title')}</span>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  screen === item.screen
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-slate-500">
              {user.name} · <span className="uppercase">{user.role}</span>
            </span>
          )}
          <button
            onClick={() => void logout()}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            {t('auth.logout')}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
    </div>
  )
}
