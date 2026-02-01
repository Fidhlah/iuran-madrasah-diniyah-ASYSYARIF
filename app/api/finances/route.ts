import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all finances with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get("type") // 'income' or 'expense'
        const year = searchParams.get("year")
        const month = searchParams.get("month")

        // Build where clause
        const whereClause: any = {}

        if (type) {
            whereClause.type = type
        }

        if (year && month) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
            whereClause.date = {
                gte: startDate,
                lte: endDate,
            }
        } else if (year) {
            const startDate = new Date(parseInt(year), 0, 1)
            const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59)
            whereClause.date = {
                gte: startDate,
                lte: endDate,
            }
        }

        const finances = await prisma.finances.findMany({
            where: whereClause,
            orderBy: { date: "desc" },
        })

        const response = NextResponse.json(finances)
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
        return response
    } catch (error) {
        console.error("Error fetching finances:", error)
        return NextResponse.json(
            { error: "Gagal mengambil data keuangan" },
            { status: 500 }
        )
    }
}

// POST - Add new manual finance entry (expense or manual income like donation)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { date, type, amount, description } = body

        // Validate required fields
        if (!date || !type || !amount) {
            return NextResponse.json(
                { error: "Field date, type, dan amount wajib diisi" },
                { status: 400 }
            )
        }

        // Validate type
        if (!['income', 'expense'].includes(type)) {
            return NextResponse.json(
                { error: "Type harus 'income' atau 'expense'" },
                { status: 400 }
            )
        }

        const finance = await prisma.finances.create({
            data: {
                date: new Date(date),
                type,
                amount,
                description: description || null,
                payment_id: null, // Manual entry, not from payment
            },
        })

        return NextResponse.json(finance, { status: 201 })
    } catch (error) {
        console.error("Error creating finance:", error)
        return NextResponse.json(
            { error: "Gagal menambah data keuangan" },
            { status: 500 }
        )
    }
}

// DELETE - Delete a manual finance entry (cannot delete payment-linked entries)
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { error: "ID wajib diisi" },
                { status: 400 }
            )
        }

        // Check if it's a payment-linked entry
        const finance = await prisma.finances.findUnique({
            where: { id },
        })

        if (!finance) {
            return NextResponse.json(
                { error: "Data keuangan tidak ditemukan" },
                { status: 404 }
            )
        }

        if (finance.payment_id) {
            return NextResponse.json(
                { error: "Tidak dapat menghapus data iuran. Batalkan pembayaran dari tabel iuran." },
                { status: 400 }
            )
        }

        await prisma.finances.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting finance:", error)
        return NextResponse.json(
            { error: "Gagal menghapus data keuangan" },
            { status: 500 }
        )
    }
}
