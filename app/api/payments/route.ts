import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

// GET - Ambil semua payments (dengan filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get("studentId") || ""
    const year = searchParams.get("year") || ""
    const month = searchParams.get("month") || ""

    const payments = await prisma.payments.findMany({
      where: {
        AND: [
          studentId ? { student_id: studentId } : {},
          year ? { year: parseInt(year) } : {},
          month ? { month: parseInt(month) } : {},
        ],
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            class: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data pembayaran" },
      { status: 500 }
    )
  }
}

// POST - Tandai pembayaran (create atau update)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, month, year, amount, isPaid, paidAt } = body

    // Cek apakah payment sudah ada
    const existingPayment = await prisma.payments.findUnique({
      where: {
        student_id_month_year: {
          student_id: studentId,
          month: month,
          year: year,
        },
      },
    })

    // Ambil nama student untuk log
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: { name: true },
    })

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    let payment

    if (existingPayment) {
      // Update payment yang sudah ada
      payment = await prisma.payments.update({
        where: { id: existingPayment.id },
        data: {
          is_paid: isPaid,
          paid_at: isPaid ? new Date(paidAt) : null,
          amount: amount,
        },
      })
    } else {
      // Buat payment baru
      payment = await prisma.payments.create({
        data: {
          student_id: studentId,
          month: month,
          year: year,
          amount: amount,
          is_paid: isPaid,
          paid_at: isPaid ? new Date(paidAt) : null,
        },
      })
    }

    // Log aktivitas
    if (isPaid) {
      await logger.paymentMarkedPaid(
        payment.id,
        student?.name || "Unknown",
        monthNames[month - 1],
        year,
        paidAt
      )
    } else {
      await logger.paymentMarkedUnpaid(
        payment.id,
        student?.name || "Unknown",
        monthNames[month - 1],
        year
      )
    }

    return NextResponse.json(payment, { status: existingPayment ? 200 : 201 })
  } catch (error) {
    console.error("Error creating/updating payment:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan pembayaran" },
      { status: 500 }
    )
  }
}