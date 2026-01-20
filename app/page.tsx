"use client"
import { useState } from "react"
import { GalaxyBackground } from "@/components/galaxy-background"
import { supabase } from "@/lib/supabase/supabase"
import { useRouter } from "next/navigation"

// Tambahkan di atas komponen WelcomePage
async function getJwt() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

export default function WelcomePage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setLoading(true)

  // Login ke Supabase Auth
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  })
  if (loginError) {
    setError("Username atau password salah")
    setLoading(false)
    return
  }
  // Setelah login
  console.log("Login sukses, ambil user id")

  // Ambil user id
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  // Setelah getUser
  console.log("User ID:", userId)

  // Query role dari tabel profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  // Setelah query profile
  console.log("Profile:", profile, "ProfileError:", profileError)

  if (profileError || !profile) {
    setError("Role user tidak ditemukan")
    setLoading(false)
    return
  }
  const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (token) {
    document.cookie = `sb-access-token=${token}; path=/`
    }

  setTimeout(() => {
    router.push("/dashboard")
    setLoading(false)
    }, 300)
}

  return (
    <div className="relative min-h-screen w-full overflow-hidden px-2 sm:px-0">
      <GalaxyBackground />
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-background/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-xs sm:max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo-asysyarif.png" alt="Logo" className="w-16 h-16 mb-2" />
            <h2 className="text-2xl font-bold mb-2 text-primary text-center">Selamat Datang</h2>
            <p className="text-sm text-muted-foreground text-center">
              Sistem Iuran Madrasah Asy-Syarif
            </p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Email</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded focus:outline-none"
                placeholder="Masukkan email"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="mb-6">
              <label className="block mb-1 text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 border rounded focus:outline-none pr-10"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? (
                    // Mata terbuka (lihat)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    // Mata tertutup (sembunyi)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95M6.873 6.872A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.956 9.956 0 01-4.043 5.112M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded hover:bg-emerald-700 transition"
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        html, body, #__next {
          height: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}