"use client"
import { localStorageProvider } from "@/lib/swr-localstorage-provider"
import { SWRConfig } from "swr"

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      provider: localStorageProvider,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 10000,
    }}>
      {children}
    </SWRConfig>
  )
}
