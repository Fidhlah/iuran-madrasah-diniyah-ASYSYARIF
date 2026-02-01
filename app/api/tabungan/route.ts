import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

// GET - Ambil rekap saldo tabungan semua santri
export async function GET(request: NextRequest) {
  try {
    const tabungan = await prisma.tabungan.findMany({
      include: {
        students: {
          select: {
            id: true,
            name: true,
            class: true,
          },
        },
      },
      orderBy: [
        { students: { class: "asc" } },
        { students: { name: "asc" } },
      ],
    })

    // Add cache-control headers to prevent browser caching
    const response = NextResponse.json(tabungan)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data tabungan" },
      { status: 500 }
    )
  }
}

// POST - Tambah rekap tabungan baru (misal untuk santri baru)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, saldo = 0, jumlah_transaksi = 0 } = body

    // Cek apakah sudah ada tabungan untuk santri ini
    const existing = await prisma.tabungan.findUnique({
      where: { student_id },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Tabungan untuk santri ini sudah ada." },
        { status: 400 }
      )
    }

    const tabungan = await prisma.tabungan.create({
      data: {
        student_id,
        saldo,
        jumlah_transaksi,
        updated_at: new Date(),
      },
    })
    return NextResponse.json(tabungan, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menambah data tabungan" },
      { status: 500 }
    )
  }
}