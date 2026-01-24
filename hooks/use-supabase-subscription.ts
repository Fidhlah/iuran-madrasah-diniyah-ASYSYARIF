import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { supabase } from '@/lib/supabase/client'

export function useSupabaseSubscription() {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  useEffect(() => {
    // Membuat channel subscription tunggal
    const channel = supabase
      .channel('global-realtime-changes')
      
      // 1. Subscribe ke tabel PAYMENTS
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Realtime update: payments', payload)
          // Refresh data SWR yang berkaitan dengan payments (menggunakan filter key)
          mutate((key) => typeof key === 'string' && key.startsWith('/api/payments'))
          // Refresh Server Components
          router.refresh()
        }
      )
      
      // 2. Subscribe ke tabel STUDENTS
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('Realtime update: students', payload)
          mutate('/api/students')
          router.refresh()
        }
      )
      
      // 3. Subscribe ke tabel SETTINGS
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        (payload) => {
          console.log('Realtime update: settings', payload)
          mutate('/api/settings')
          router.refresh()
        }
      )
      .subscribe()

    // Cleanup saat unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, mutate])
}
