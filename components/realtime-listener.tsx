'use client'

import { useSupabaseSubscription } from "@/hooks/use-supabase-subscription"

export function RealtimeListener() {
  useSupabaseSubscription()
  return null // Komponen ini tidak merender UI apapun
}
