'use client'

import { useEffect, useRef } from 'react'

type Asteroid = {
  angle: number
  speed: number
  orbitRX: number
  orbitRY: number
  tiltSin: number
  tiltCos: number
  size: number
  r: number
  g: number
  b: number
  trail: { x: number; y: number }[]
}

export function BaralPlanet({ size = 260 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const S = size
    canvas.width = S * DPR
    canvas.height = S * DPR
    canvas.style.width = `${S}px`
    canvas.style.height = `${S}px`
    ctx.scale(DPR, DPR)

    const CX = S / 2
    const CY = S / 2
    const R = S * 0.33

    // Asteroid colors as rgb values to avoid string ops in loop
    const astColors = [
      [196, 181, 253],
      [167, 139, 250],
      [221, 214, 254],
      [233, 213, 255],
      [139, 92, 246],
    ]

    const asteroids: Asteroid[] = Array.from({ length: 8 }, (_, i) => {
      const tilt = (Math.random() - 0.5) * 0.9
      const col = astColors[i % astColors.length]
      return {
        angle: (i / 8) * Math.PI * 2 + Math.random(),
        speed: 0.0025 + Math.random() * 0.005,
        orbitRX: R * (1.45 + Math.random() * 0.55),
        orbitRY: R * (0.28 + Math.random() * 0.22),
        tiltSin: Math.sin(tilt),
        tiltCos: Math.cos(tilt),
        size: 1.4 + Math.random() * 2.2,
        r: col[0],
        g: col[1],
        b: col[2],
        trail: [],
      }
    })

    let rotation = 0
    let raf: number

    const drawFrame = () => {
      ctx.clearRect(0, 0, S, S)
      rotation += 0.0022

      /* ── outer atmosphere glow ── */
      const glow = ctx.createRadialGradient(CX, CY, R * 0.7, CX, CY, R * 1.9)
      glow.addColorStop(0, `rgba(139,92,246,0.22)`)
      glow.addColorStop(0.55, `rgba(109,40,217,0.08)`)
      glow.addColorStop(1, `transparent`)
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(CX, CY, R * 1.9, 0, Math.PI * 2)
      ctx.fill()

      /* ── planet body ── */
      const grad = ctx.createRadialGradient(CX - R * 0.28, CY - R * 0.3, R * 0.05, CX + R * 0.1, CY + R * 0.1, R)
      grad.addColorStop(0, `#d4bbff`)
      grad.addColorStop(0.22, `#a78bfa`)
      grad.addColorStop(0.55, `#7c3aed`)
      grad.addColorStop(0.82, `#4c1d95`)
      grad.addColorStop(1, `#1a004a`)
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      /* ── grid lines clipped to sphere ── */
      ctx.save()
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.clip()

      // Latitude lines
      ctx.lineWidth = 0.7
      for (let lat = -70; lat <= 70; lat += 20) {
        const rad = (lat * Math.PI) / 180
        const y = CY + R * Math.sin(rad)
        const r = R * Math.cos(rad)
        if (r < 1) continue
        const a = 0.08 + 0.12 * Math.pow(Math.cos(rad), 2)
        ctx.strokeStyle = `rgba(196,181,253,${a.toFixed(2)})`
        ctx.beginPath()
        ctx.ellipse(CX, y, r, r * 0.2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Longitude meridians — parametric sphere projection
      for (let i = 0; i < 9; i++) {
        const lng = (i / 9) * Math.PI * 2 + rotation
        const cosL = Math.cos(lng)
        if (cosL < -0.05) continue // backface cull
        const alpha = cosL * 0.22
        ctx.strokeStyle = `rgba(167,139,250,${alpha.toFixed(3)})`
        ctx.lineWidth = 0.8

        // Path from top pole to bottom pole with bezier bulge
        const bulge = R * Math.sin(lng)
        ctx.beginPath()
        ctx.moveTo(CX + bulge * 0.05, CY - R)
        ctx.bezierCurveTo(
          CX + bulge * 1.05, CY - R * 0.5,
          CX + bulge * 1.05, CY + R * 0.5,
          CX + bulge * 0.05, CY + R,
        )
        ctx.stroke()
      }

      // Specular highlight
      const highlight = ctx.createRadialGradient(
        CX - R * 0.32, CY - R * 0.32, 0,
        CX - R * 0.32, CY - R * 0.32, R * 0.7,
      )
      highlight.addColorStop(0, `rgba(255,255,255,0.16)`)
      highlight.addColorStop(0.6, `rgba(255,255,255,0.03)`)
      highlight.addColorStop(1, `transparent`)
      ctx.fillStyle = highlight
      ctx.fillRect(CX - R, CY - R, R * 2, R * 2)

      ctx.restore()

      /* ── atmosphere rim ── */
      ctx.beginPath()
      ctx.arc(CX, CY, R + 1.2, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(167,139,250,0.42)`
      ctx.lineWidth = 2.2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(CX, CY, R + 5, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(139,92,246,0.10)`
      ctx.lineWidth = 6
      ctx.stroke()

      /* ── asteroids ── */
      for (const ast of asteroids) {
        ast.angle += ast.speed

        // Elliptical orbit with tilt
        const ox = Math.cos(ast.angle) * ast.orbitRX
        const oy = Math.sin(ast.angle) * ast.orbitRY
        const x = CX + ox * ast.tiltCos - oy * ast.tiltSin
        const y = CY + ox * ast.tiltSin + oy * ast.tiltCos

        ast.trail.push({ x, y })
        if (ast.trail.length > 18) ast.trail.shift()

        // Trail
        if (ast.trail.length > 2) {
          for (let t = 1; t < ast.trail.length; t++) {
            const ta = (t / ast.trail.length) * 0.55
            ctx.beginPath()
            ctx.moveTo(ast.trail[t - 1].x, ast.trail[t - 1].y)
            ctx.lineTo(ast.trail[t].x, ast.trail[t].y)
            ctx.strokeStyle = `rgba(${ast.r},${ast.g},${ast.b},${ta.toFixed(3)})`
            ctx.lineWidth = ast.size * 0.5 * (t / ast.trail.length)
            ctx.lineCap = 'round'
            ctx.stroke()
          }
        }

        // Glow halo
        const halo = ctx.createRadialGradient(x, y, 0, x, y, ast.size * 3.5)
        halo.addColorStop(0, `rgba(${ast.r},${ast.g},${ast.b},0.7)`)
        halo.addColorStop(0.45, `rgba(${ast.r},${ast.g},${ast.b},0.18)`)
        halo.addColorStop(1, `transparent`)
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(x, y, ast.size * 3.5, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.fillStyle = `rgba(${ast.r},${ast.g},${ast.b},0.95)`
        ctx.beginPath()
        ctx.arc(x, y, ast.size, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(drawFrame)
    }

    raf = requestAnimationFrame(drawFrame)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={canvasRef} aria-hidden="true" />
}
