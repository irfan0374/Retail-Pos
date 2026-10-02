import { create } from 'zustand'
import type { SafeUser } from '@shared/types/user'
import { useCartStore } from './cartStore'

interface AuthState {
  user: SafeUser | null
  status: 'loading' | 'ready'
  refresh: () => Promise<void>
  login: (pin: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  refresh: async () => {
    const user = await window.api.auth.current()
    set({ user, status: 'ready' })
  },

  login: async (pin) => {
    const user = await window.api.auth.login({ pin })
    set({ user })
  },

  logout: async () => {
    await window.api.auth.logout()
    // The cart lives outside the checkout screen, so it would otherwise carry over to whoever logs in next.
    useCartStore.getState().clear()
    set({ user: null })
  }
}))
