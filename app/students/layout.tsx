import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Navbar } from "@/components/layout"
import { Toaster } from "@/components/ui/toaster"
import "../globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistem Iuran Madrasah - ASY SYARIF",
  description: "Sistem pencatatan iuran bulanan santri dengan manajemen data siswa terintegrasi",
  generator: "Hafidh Fadhilah",
  icons: {
    icon: [
      {
        url: "/cropped.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/cropped.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/cropped.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/cropped.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`font-sans antialiased bg-background`}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pb-12">
            {children}
          </main>
          <Toaster />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
