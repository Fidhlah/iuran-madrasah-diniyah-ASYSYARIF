import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTabungan() {
  const { data, error, isLoading, mutate } = useSWR("/api/tabungan", fetcher, {
    // Rely on realtime subscription for updates, not revalidateOnMount
    // This reduces API calls - data only refreshes via subscription or manual mutate()
    keepPreviousData: true,
  })
  return {
    data,
    error,
    isLoading,
    mutate,
  }
}