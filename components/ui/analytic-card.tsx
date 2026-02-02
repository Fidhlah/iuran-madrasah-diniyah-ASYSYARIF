"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type ColorVariant = "slate" | "emerald" | "rose" | "blue" | "amber"

interface AnalyticCardProps {
    title: string
    value: number | string
    subtitle?: string
    color?: ColorVariant
    loading?: boolean
    formatCurrency?: boolean
    /** Custom text color class based on value condition */
    valueColorClass?: string
}

const colorClasses: Record<ColorVariant, {
    card: string
    circle: string
    value: string
}> = {
    slate: {
        card: "from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800",
        circle: "bg-slate-500/10",
        value: "text-foreground",
    },
    emerald: {
        card: "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950",
        circle: "bg-emerald-500/10",
        value: "text-emerald-700 dark:text-emerald-400",
    },
    rose: {
        card: "from-rose-50 to-red-50 dark:from-rose-950 dark:to-red-950",
        circle: "bg-rose-500/10",
        value: "text-rose-700 dark:text-rose-400",
    },
    blue: {
        card: "from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950",
        circle: "bg-blue-500/10",
        value: "text-blue-700 dark:text-blue-400",
    },
    amber: {
        card: "from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950",
        circle: "bg-amber-500/10",
        value: "text-amber-600 dark:text-amber-400",
    },
}

export function AnalyticCard({
    title,
    value,
    subtitle,
    color = "slate",
    loading = false,
    formatCurrency = false,
    valueColorClass,
}: AnalyticCardProps) {
    const colors = colorClasses[color]
    const displayValue = formatCurrency && typeof value === "number"
        ? `Rp ${value.toLocaleString("id-ID")}`
        : value

    return (
        <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${colors.card}`}>
            <div className={`absolute top-0 right-0 w-20 h-20 ${colors.circle} rounded-full -mr-10 -mt-10`} />
            <CardContent className="pt-6 relative">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {loading ? (
                    <Skeleton className="h-9 w-32 mt-2 mb-1" />
                ) : (
                    <p className={`text-3xl font-bold mt-2 tracking-tight ${valueColorClass || colors.value}`}>
                        {displayValue}
                    </p>
                )}
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    )
}
