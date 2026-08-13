'use client'

import { useEffect, useRef } from 'react'

type Star = {
  x: number
  y: number
  z: number
  r: number
  tw: number
  hue: number
}

/**
 * Fixed, full-viewport animated starfield with parallax drift and slow twinkle.
 * Purely decorative — hidden from assistive tech, disabled under reduced motion.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let stars: Star[] = []
    let raf = 0
    let scrollY = window.scrollY

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const build = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const density = Math.min(260, Math.round((width * height) / 9000))
      stars = Array.from({ length: density }, () => {
        const z = Math.random()
        return {
          x: Math.random() * width,
          y: Math.random() * height * 1.6,
          z,
          r: 0.35 + z * 1.35,
          tw: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.82 ? 305 : Math.random() > 0.5 ? 195 : 270,
        }
      })
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        const parallax = (scrollY * (0.06 + s.z * 0.22)) % (height * 1.6)
        const y = ((s.y - parallax) % (height * 1.6) + height * 1.6) % (height * 1.6)
        if (y > height + 4) continue
        const twinkle = reduced ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(t * 0.0006 + s.tw))
        const alpha = (0.18 + s.z * 0.62) * twinkle
        ctx.beginPath()
        ctx.fillStyle = `oklch(0.95 ${s.hue === 270 ? 0.02 : 0.11} ${s.hue} / ${alpha.toFixed(3)})`
        ctx.arc(s.x, y, s.r, 0, Math.PI * 2)
        ctx.fill()

        if (s.z > 0.9) {
          ctx.beginPath()
          ctx.fillStyle = `oklch(0.95 0.12 ${s.hue} / ${(alpha * 0.14).toFixed(3)})`
          ctx.arc(s.x, y, s.r * 5.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      raf = requestAnimationFrame(draw)
    }

    const onScroll = () => {
      scrollY = window.scrollY
    }

    build()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', build)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', build)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Nebula clouds */}
      <div
        className="animate-orbit-drift absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full opacity-40 blur-[90px]"
        style={{ background: 'radial-gradient(circle, oklch(0.62 0.24 300 / 0.55), transparent 68%)' }}
      />
      <div
        className="animate-orbit-drift absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full opacity-30 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, oklch(0.7 0.16 205 / 0.5), transparent 68%)',
          animationDuration: '26s',
          animationDirection: 'reverse',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 70% at 50% -10%, oklch(0.62 0.24 300 / 0.16), transparent 60%), radial-gradient(ellipse 90% 60% at 50% 110%, oklch(0.7 0.16 205 / 0.1), transparent 60%)',
        }}
      />
      {/* grid of celestial coordinates */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(0.9 0.02 280) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.9 0.02 280) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%)',
        }}
      />
    </div>
  )
}
