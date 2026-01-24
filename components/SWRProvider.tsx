"use client"
import { SWRConfig } from "swr"
import { localStorageProvider } from "@/lib/swr-localstorage-provider"

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      provider: localStorageProvider,
      // JANGAN matikan revalidateOnMount. SWR butuh ini untuk fetch pertama kali.
      revalidateOnFocus: false, 
      // Ini kuncinya: Jika data ada di cache, jangan ambil lagi lewat network saat navigasi.
      revalidateIfStale: false, 
      // Batasi interval deduping agar tidak double fetch dalam waktu singkat
      dedupingInterval: 10000, 
    }}>
      {children}
    </SWRConfig>
  )
}