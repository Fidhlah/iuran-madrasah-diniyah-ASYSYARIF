import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(request: NextRequest) {
  // Ambil JWT dari cookie Supabase (default: sb-access-token)
  const token = request.cookies.get("sb-access-token")?.value

  // Proteksi hanya untuk route dashboard (dan turunannya)
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      // Redirect ke halaman login/welcome jika tidak ada token
      return NextResponse.redirect(new URL("/", request.url))
    }
    // (Opsional) Di sini kamu bisa decode dan cek expired token jika mau
  }

  return NextResponse.next()
}

// Tentukan route yang diproteksi
export const config = {
  matcher: ["/dashboard/:path*"],
}