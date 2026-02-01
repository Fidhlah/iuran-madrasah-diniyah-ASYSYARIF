import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

const prisma = new PrismaClient()

// GET - Ambil semua transaksi tabungan (bisa filter by student_id)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get("student_id") || ""

    const where = studentId ? { student_id: studentId } : {}

    const transaksi = await prisma.tabungan_transaksi.findMany({
      where,
      include: {
        students: {
          select: { id: true, name: true, class: true }
        }
      },
      orderBy: [{ tanggal: "desc" }],
    })

    // Add cache-control headers to prevent browser caching
    const response = NextResponse.json(transaksi)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data transaksi tabungan" }, { status: 500 })
  }
}

// POST - Tambah transaksi setor/tarik tabungan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, jenis, nominal, keterangan } = body

    // Ambil saldo terakhir
    const tabungan = await prisma.tabungan.findUnique({
      where: { student_id },
    })

    // Pastikan saldoBaru dan nominal bertipe number
    let saldoBaru = Number(tabungan?.saldo ?? 0)
    const nominalNumber = Number(nominal)

    if (jenis === "setor") saldoBaru += nominalNumber
    else if (jenis === "tarik") saldoBaru -= nominalNumber

    // Buat transaksi baru
    const transaksi = await prisma.tabungan_transaksi.create({
      data: {
        student_id,
        jenis,
        nominal: nominalNumber,
        keterangan,
        saldo_setelah: saldoBaru,
        tanggal: new Date(),
      },
    })

    if (!tabungan) {
      // Jika belum ada, buat data tabungan baru
      await prisma.tabungan.create({
        data: {
          student_id,
          saldo: saldoBaru,
          jumlah_transaksi: 1,
          updated_at: new Date(),
        },
      })
    } else {
      const updated = await prisma.tabungan.update({
        where: { student_id },
        data: {
          saldo: saldoBaru,
          jumlah_transaksi: { increment: 1 },
          updated_at: new Date(),
        },
      })
    }

    return NextResponse.json(transaksi, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan transaksi tabungan" }, { status: 500 })
  }
}