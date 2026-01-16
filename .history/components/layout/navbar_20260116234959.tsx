"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { BookOpen, LayoutDashboard, Users, Clock } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { id: "students", label: "Data santri", icon: Users, href: "/students" },
  ]

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Asy Syarif</h1>
              <p className="text-xs text-muted-foreground">Sistem Iuran Madrasah</p>
            </div>
          </Link>

          {/* Center: Navigation Tabs */}
          <div className="hidden md:flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = isActive(tab.href)
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              )
            })}
          </div>

          {/* Right: Clock & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Realtime Clock - Desktop */}
            {currentTime && (
              <div className="hidden md:flex items-center gap-2 text-right">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatTime(currentTime)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(currentTime)}</p>
                </div>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="md:hidden flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const active = isActive(tab.href)
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      active 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "text-foreground hover:bg-secondary/80"
                    }`}
                    title={tab.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
