import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { supabase } from '@/lib/supabase/client'
import { FEATURES } from '@/lib/feature-flags'

/**
 * Supabase Realtime Subscription Hook
 * 
 * PURPOSE: Single source of truth for data refresh
 * - When ANY user makes a change, ALL connected users get fresh data
 * - Components should NOT call mutate() after API calls
 * - This subscription handles ALL data refresh automatically
 * 
 * EXPECTED API CALLS:
 * - 1 call per database change (INSERT/UPDATE/DELETE)
 * - If you see duplicate calls, check if component is also calling mutate()
 */
export function useSupabaseSubscription() {
  const { mutate } = useSWRConfig()

  useEffect(() => {
    const channel = supabase
      .channel('global-realtime-changes')

      // 1. PAYMENTS - refresh when payment data changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('🔄 Realtime: payments', payload.eventType)
          mutate('/api/payments', undefined, { revalidate: true })
        }
      )

      // 2. STUDENTS - refresh when student data changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('🔄 Realtime: students', payload.eventType)
          mutate('/api/students', undefined, { revalidate: true })

          // Cascade: if student deleted and tabungan feature is enabled
          if (payload.eventType === 'DELETE' && FEATURES.TABUNGAN) {
            console.log('🔄 Realtime: cascade refresh tabungan (student deleted)')
            mutate('/api/tabungan', undefined, { revalidate: true })
            mutate('/api/tabungan-transaksi', undefined, { revalidate: true })
          }
        }
      )

      // 3. SETTINGS - refresh when settings change
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          console.log('🔄 Realtime: settings', payload.eventType)
          mutate('/api/settings', undefined, { revalidate: true })
        }
      )

      // 4. TABUNGAN - only subscribe if feature is enabled
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tabungan' },
        (payload) => {
          if (!FEATURES.TABUNGAN) return // Skip if feature disabled
          console.log('🔄 Realtime: tabungan', payload.eventType)
          mutate('/api/tabungan', undefined, { revalidate: true })
        }
      )

      // 5. TABUNGAN_TRANSAKSI - only subscribe if feature is enabled
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tabungan_transaksi' },
        (payload) => {
          if (!FEATURES.TABUNGAN) return // Skip if feature disabled
          console.log('🔄 Realtime: tabungan_transaksi', payload.eventType)
          mutate('/api/tabungan-transaksi', undefined, { revalidate: true })
          mutate('/api/tabungan', undefined, { revalidate: true })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate])
}


