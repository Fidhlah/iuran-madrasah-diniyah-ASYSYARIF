import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Settings } from "./use-settings"

interface SettingsStore {
  settings: Settings
  loading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: {
        monthly_fee: "",
        school_name: "",
        academic_year: "",
      },
      loading: false,
      error: null,
      async fetchSettings() {
        set({ loading: true })
        try {
          const res = await fetch("/api/settings")
          if (!res.ok) throw new Error("Gagal mengambil pengaturan")
          const data = await res.json()
          set({ settings: data, loading: false, error: null })
        } catch (err) {
          set({
            loading: false,
            error: err instanceof Error ? err.message : "Terjadi kesalahan",
          })
        }
      },
      async updateSetting(key: string, value: string) {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        })
        if (!res.ok) throw new Error("Gagal menyimpan pengaturan")
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        }))
      },
    }),
    {
      name: "settings-storage",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)