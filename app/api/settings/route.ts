import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

// GET - Ambil semua settings
export async function GET() {
  try {
    const settings = await prisma.settings.findMany()

    // Transform ke object { key: value }
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Gagal mengambil pengaturan" },
      { status: 500 }
    )
  }
}

// PUT - Update setting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    // Ambil nilai lama untuk log
    const oldSetting = await prisma.settings.findUnique({
      where: { key },
    })

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    // Log aktivitas
    await logger.settingUpdated(
      key,
      oldSetting?.value || "",
      value
    )

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan" },
      { status: 500 }
    )
  }
}