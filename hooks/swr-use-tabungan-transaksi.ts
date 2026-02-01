import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTabunganTransaksi(student_id?: string) {
  const url = student_id ? `/api/tabungan-transaksi?student_id=${student_id}` : "/api/tabungan-transaksi"
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    keepPreviousData: true,
  })

  // Fungsi untuk POST transaksi baru
  async function createTransaksi(input: {
    student_id: string
    jenis: "setor" | "tarik"
    nominal: number
    keterangan?: string
  }) {
    const res = await fetch("/api/tabungan-transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error("Gagal menambah transaksi")
    // Subscription handles data refresh - no manual mutate() needed
    return res.json()
  }

  return {
    data,
    error,
    isLoading,
    mutate,
    createTransaksi,
  }
}