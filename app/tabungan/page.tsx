"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import TabunganPage from "@/components/tabungan/tabungan-page"
import { FEATURES } from "@/lib/feature-flags"

export default function TabunganPageRoute() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home if feature is disabled
    if (!FEATURES.TABUNGAN) {
      router.replace('/')
    }
  }, [router])

  // Don't render if feature is disabled
  if (!FEATURES.TABUNGAN) {
    return null
  }

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TabunganPage />
    </div>
  )
}