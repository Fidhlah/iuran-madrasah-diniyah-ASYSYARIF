import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { Finance } from "@/types/models"

export function useFinances() {
    // Always fetch all data - filtering is done client-side in the component
    // This ensures realtime subscription can mutate the correct SWR key
    const { data, error, isLoading, mutate } = useSWR<Finance[]>("/api/finances", fetcher, {
        keepPreviousData: true,
    })

    // Helper functions
    const createFinance = async (finance: {
        date: string
        type: "income" | "expense"
        amount: number
        description?: string
    }) => {
        const res = await fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finance),
        })
        if (!res.ok) throw new Error("Gagal menambah data keuangan")
        const result = await res.json()
        // Trigger immediate refresh
        mutate()
        return result
    }

    const deleteFinance = async (id: string) => {
        const res = await fetch(`/api/finances?id=${id}`, {
            method: "DELETE",
        })
        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || "Gagal menghapus data keuangan")
        }
        const result = await res.json()
        // Trigger immediate refresh
        mutate()
        return result
    }

    // Calculate summary
    const summary = {
        totalIncome: (data || [])
            .filter(f => f.type === "income")
            .reduce((sum, f) => sum + Number(f.amount), 0),
        totalExpense: (data || [])
            .filter(f => f.type === "expense")
            .reduce((sum, f) => sum + Number(f.amount), 0),
        balance: 0,
    }
    summary.balance = summary.totalIncome - summary.totalExpense

    return {
        finances: data || [],
        loading: isLoading,
        error,
        mutate,
        createFinance,
        deleteFinance,
        summary,
    }
}
