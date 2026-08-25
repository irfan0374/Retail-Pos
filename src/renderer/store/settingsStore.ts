import { create } from 'zustand'
import type { ShopSettings } from '@shared/types/settings'

interface SettingsState {
  settings: ShopSettings | null
  load: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,

  load: async () => {
    const settings = await window.api.settings.get()
    set({ settings })
  }
}))
