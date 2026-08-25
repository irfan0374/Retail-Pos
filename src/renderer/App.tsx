import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { LoginScreen } from './features/auth/LoginScreen'
import { AppShell, type Screen } from './app/AppShell'
import { CheckoutScreen } from './features/checkout/CheckoutScreen'
import { ProductListScreen } from './features/products/ProductListScreen'
import { MetalRateScreen } from './features/metal-rates/MetalRateScreen'
import { PurchasesScreen } from './features/purchases/PurchasesScreen'
import { ReturnsScreen } from './features/returns/ReturnsScreen'
import { ReportsScreen } from './features/reports/ReportsScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { AuditLogScreen } from './features/auditLog/AuditLogScreen'
import { ShopSettingsScreen } from './features/settings/ShopSettingsScreen'

export default function App() {
  const { user, status, refresh } = useAuthStore()
  const [screen, setScreen] = useState<Screen>('checkout')

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (status === 'loading') return null
  if (!user) return <LoginScreen />

  return (
    <AppShell screen={screen} onNavigate={setScreen}>
      {screen === 'checkout' && <CheckoutScreen />}
      {screen === 'products' && <ProductListScreen />}
      {screen === 'metalRates' && <MetalRateScreen />}
      {screen === 'purchases' && <PurchasesScreen />}
      {screen === 'returns' && <ReturnsScreen />}
      {screen === 'reports' && <ReportsScreen />}
      {screen === 'dashboard' && <DashboardScreen />}
      {screen === 'auditLog' && <AuditLogScreen />}
      {screen === 'settings' && <ShopSettingsScreen />}
    </AppShell>
  )
}
