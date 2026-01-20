"use client"

import { useEffect, useRef } from "react"
export function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const stars: Array<{
      x: number
      y: number
      size: number
      speed: number
      opacity: number
      color: string
    }> = []

    // Warna lebih kontras dan ada putih terang
    const colors = ["#14b8a6", "#0d9488", "#10b981", "#f59e0b", "#fbbf24", "#ffffff", "#fff9c4"]

    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 1, // ukuran minimal 1, maksimal 3.5
        speed: Math.random() * 0.3 + 0.08, // sedikit lebih cepat
        opacity: Math.random() * 0.5 + 0.5, // opacity lebih tinggi
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const animate = () => {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#134e4a")    // teal-900
      gradient.addColorStop(0.5, "#115e59")  // teal-800
      gradient.addColorStop(1, "#164e63")    // cyan-900
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Efek cahaya radial
      const radialGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 1.5
      )
      radialGradient.addColorStop(0, "rgba(20, 184, 166, 0.08)")
      radialGradient.addColorStop(0.5, "rgba(16, 185, 129, 0.05)")
      radialGradient.addColorStop(1, "rgba(245, 158, 11, 0.03)")
      ctx.fillStyle = radialGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach((star) => {
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }

        star.opacity += (Math.random() - 0.5) * 0.06
        star.opacity = Math.max(0.5, Math.min(1, star.opacity))

        ctx.save()
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.globalAlpha = star.opacity * 0.8
        ctx.fillStyle = star.color
        ctx.shadowColor = star.color
        ctx.shadowBlur = star.size > 2 ? 16 : 6 // glow lebih besar untuk bintang besar
        ctx.fill()

        // Tambahkan outline putih untuk bintang besar
        if (star.size > 2.5) {
          ctx.lineWidth = 1.5
          ctx.globalAlpha = 0.7
          ctx.strokeStyle = "#fff"
          ctx.stroke()
        }
        ctx.restore()
      })

      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}