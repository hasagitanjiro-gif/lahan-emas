import { useEffect, useRef } from 'react'

type Coin = {
  x: number
  y: number
  r: number
  vy: number
  sway: number
  phase: number
  spin: number
  angle: number
  alpha: number
}

/**
 * Hujan koin emas untuk latar hero.
 * Canvas ringan (satu rAF loop), otomatis berhenti saat tab tidak aktif,
 * dan tidak dirender sama sekali bila pengguna memilih reduced motion.
 */
export function CoinRain({ density = 26 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let coins: Coin[] = []

    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    const spawn = (initial: boolean): Coin => ({
      x: rand(0, w),
      y: initial ? rand(-h * 0.2, h) : rand(-90, -20),
      r: rand(5, 11),
      vy: rand(45, 100), // px per detik
      sway: rand(10, 30),
      phase: rand(0, Math.PI * 2),
      spin: rand(0.8, 2.4),
      angle: rand(0, Math.PI * 2),
      alpha: rand(0.3, 0.75),
    })

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.max(14, Math.round((w / 1280) * density))
      coins = Array.from({ length: n }, () => spawn(true))
    }

    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      ctx.clearRect(0, 0, w, h)

      for (const c of coins) {
        c.y += c.vy * dt
        c.angle += c.spin * dt
        if (c.y - c.r > h) Object.assign(c, spawn(false))

        const x = c.x + Math.sin(now / 1000 + c.phase) * c.sway
        // Koin "berputar": elips yang memipih sesuai sudut
        const squash = Math.abs(Math.cos(c.angle)) * 0.7 + 0.3

        ctx.save()
        ctx.translate(x, c.y)
        ctx.scale(1, squash)
        ctx.globalAlpha = c.alpha
        const g = ctx.createRadialGradient(-c.r * 0.35, -c.r * 0.35, c.r * 0.15, 0, 0, c.r)
        g.addColorStop(0, '#F7E7B5')
        g.addColorStop(0.55, '#D4AF37')
        g.addColorStop(1, '#9C7C22')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(0, 0, c.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(247, 231, 181, 0.5)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
}
