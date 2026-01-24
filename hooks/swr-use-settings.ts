import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { Settings } from "./use-settings"

export function useSWRSettings() {
  const { data, error, isLoading, mutate } = useSWR<Settings>("/api/settings", fetcher)

  // Update setting (PUT), lalu refresh data
  const updateSetting = async (key: string, value: string) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) throw new Error("Gagal menyimpan pengaturan")
    await mutate() // refresh settings
  }

  return {
    settings: data,
    loading: isLoading,
    error,
    mutate,
    updateSetting,
  }
}