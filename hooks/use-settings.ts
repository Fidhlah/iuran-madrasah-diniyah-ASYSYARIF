import { useState, useEffect, useCallback } from "react"

export interface Settings {
  monthly_fee: string
  school_name: string
  academic_year: string
  [key: string]: string
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    monthly_fee: "50000",
    school_name: "Madrasah",
    academic_year: "2024/2025",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Gagal mengambil pengaturan")
      const data = await res.json()
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  // Update setting
  const updateSetting = async (key: string, value: string) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) throw new Error("Gagal menyimpan pengaturan")
    
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Helper: Ambil nominal iuran (dalam number)
  const getMonthlyFee = (): number => {
    return parseInt(settings.monthly_fee) || 50000
  }


  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
    getMonthlyFee,
  }
}