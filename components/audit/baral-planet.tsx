'use client'

import { useEffect, useRef } from 'react'

type Asteroid = {
  angle: number; speed: number; orbitRX: number; orbitRY: number
  tiltSin: number; tiltCos: number; size: number
  r: number; g: number; b: number; trail: { x: number; y: number }[]
}

export function BaralPlanet({ size = 260 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const maybeCtx = canvas.getContext('2d')
    if (!maybeCtx) return
    // Anotación explícita no-nullable: drawLogo/drawRing son declaraciones de
    // función (hoisted), y TypeScript descarta el narrowing por control de flujo
    // dentro de ellas. Sin esto son 28 errores de "ctx is possibly null".
    const ctx: CanvasRenderingContext2D = maybeCtx

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const S = size
    canvas.width  = S * DPR
    canvas.height = S * DPR
    canvas.style.width  = `${S}px`
    canvas.style.height = `${S}px`
    ctx.scale(DPR, DPR)

    const CX = S / 2
    const CY = S / 2
    const R  = S * 0.34

    // Lockup oficial (400×364). Se usa el PNG y no el SVG antiguo: drawImage
    // rasteriza PNG sin problema, mientras que un SVG con <text> se dibuja sin
    // el texto en todos los navegadores.
    const LOGO_W = R * 1.2
    const LOGO_H = LOGO_W * (364 / 400)
    const logoImg = new Image()
    let logoReady = false
    logoImg.onload = () => { logoReady = true }
    logoImg.src = '/baral-lockup.png'

    // ── Dibuja el lockup oficial sobre la esfera ─────────────────────────
    function drawLogo(
      perspScale: number,   // Math.cos(logoAngle) — compresión en X por perspectiva
      alpha: number,
      cx: number,
      cy: number,
    ) {
      if (Math.abs(perspScale) < 0.01 || !logoReady) return

      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(perspScale, 1)
      ctx.globalAlpha = alpha
      // El arte ya trae su propio halo, no se le añade glow extra.
      ctx.drawImage(logoImg, -LOGO_W / 2, -LOGO_H / 2, LOGO_W, LOGO_H)
      ctx.restore()
    }

    // ── Ring ────────────────────────────────────────────────────────────
    function drawRing(behind: boolean) {
      ctx.save()
      ctx.translate(CX, CY)
      const outerRX = R * 1.88; const outerRY = R * 0.235
      const midRX   = R * 1.58; const midRY   = R * 0.197
      const innerRX = R * 1.34; const innerRY = R * 0.165

      const startAngle = behind ? Math.PI : 0
      const endAngle   = behind ? Math.PI * 2 : Math.PI

      const grad = ctx.createLinearGradient(-outerRX, 0, outerRX, 0)
      grad.addColorStop(0,    'rgba(91,45,186,0)')
      grad.addColorStop(0.12, 'rgba(139,92,246,0.28)')
      grad.addColorStop(0.32, 'rgba(196,181,253,0.65)')
      grad.addColorStop(0.5,  'rgba(230,215,255,0.80)')
      grad.addColorStop(0.68, 'rgba(196,181,253,0.65)')
      grad.addColorStop(0.88, 'rgba(139,92,246,0.28)')
      grad.addColorStop(1,    'rgba(91,45,186,0)')

      ctx.beginPath()
      ctx.ellipse(0, 0, outerRX, outerRY, 0, startAngle, endAngle)
      ctx.strokeStyle = grad
      ctx.lineWidth = behind ? 3.5 : 5.5
      ctx.globalAlpha = behind ? 0.42 : 0.88
      ctx.stroke()

      // Cassini gap
      ctx.beginPath()
      ctx.ellipse(0, 0, midRX, midRY, 0, startAngle, endAngle)
      ctx.strokeStyle = 'rgba(20,10,50,0.55)'
      ctx.lineWidth = behind ? 3 : 5
      ctx.globalAlpha = 1
      ctx.stroke()

      // Inner thin ring
      ctx.beginPath()
      ctx.ellipse(0, 0, innerRX, innerRY, 0, startAngle, endAngle)
      ctx.strokeStyle = 'rgba(196,181,253,0.25)'
      ctx.lineWidth = 1.2
      ctx.globalAlpha = behind ? 0.22 : 0.52
      ctx.stroke()

      ctx.restore()
    }

    // ── Asteroids ───────────────────────────────────────────────────────
    const astColors: [number, number, number][] = [
      [196, 181, 253], [167, 139, 250], [221, 214, 254],
      [139,  92, 246], [109,  40, 217], [232, 220, 255],
    ]
    const asteroids: Asteroid[] = Array.from({ length: 7 }, (_, i) => {
      const tilt = (Math.random() - 0.5) * 0.78
      const col  = astColors[i % astColors.length]
      return {
        angle: (i / 7) * Math.PI * 2 + Math.random() * 0.5,
        speed: 0.0022 + Math.random() * 0.0038,
        orbitRX: R * (1.55 + Math.random() * 0.48),
        orbitRY: R * (0.24 + Math.random() * 0.17),
        tiltSin: Math.sin(tilt), tiltCos: Math.cos(tilt),
        size: 1.2 + Math.random() * 2.0,
        r: col[0], g: col[1], b: col[2],
        trail: [],
      }
    })

    let rotation  = 0
    let logoAngle = 0
    let raf: number

    const draw = () => {
      ctx.clearRect(0, 0, S, S)
      rotation  += 0.0016
      logoAngle += 0.0042

      // Outer atmosphere glow
      const atm = ctx.createRadialGradient(CX, CY, R * 0.8, CX, CY, R * 2.1)
      atm.addColorStop(0,   'rgba(109,40,217,0.20)')
      atm.addColorStop(0.4, 'rgba(91,45,186,0.08)')
      atm.addColorStop(1,   'transparent')
      ctx.fillStyle = atm
      ctx.beginPath()
      ctx.arc(CX, CY, R * 2.1, 0, Math.PI * 2)
      ctx.fill()

      drawRing(true)

      // ── Planet body ──
      const body = ctx.createRadialGradient(
        CX - R * 0.32, CY - R * 0.36, R * 0.02,
        CX + R * 0.06, CY + R * 0.06, R * 1.04
      )
      body.addColorStop(0,    '#ede0ff')
      body.addColorStop(0.06, '#d4bbff')
      body.addColorStop(0.18, '#b49dff')
      body.addColorStop(0.38, '#8b5cf6')
      body.addColorStop(0.58, '#6d28d9')
      body.addColorStop(0.76, '#4c1d95')
      body.addColorStop(0.90, '#2e0a6e')
      body.addColorStop(1,    '#09001e')

      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.fillStyle = body
      ctx.fill()

      // ── Surface details (clipped) ──
      ctx.save()
      ctx.beginPath()
      ctx.arc(CX, CY, R, 0, Math.PI * 2)
      ctx.clip()

      for (let lat = -65; lat <= 65; lat += 22) {
        const rad = (lat * Math.PI) / 180
        const ry  = CY + R * Math.sin(rad)
        const rr  = R * Math.cos(rad)
        if (rr < 1) continue
        const a = 0.04 + 0.09 * Math.pow(Math.cos(rad), 2)
        ctx.strokeStyle = `rgba(196,181,253,${a.toFixed(2)})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.ellipse(CX, ry, rr, rr * 0.17, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      for (let i = 0; i < 9; i++) {
        const lng  = (i / 9) * Math.PI * 2 + rotation
        const cosL = Math.cos(lng)
        if (cosL < 0) continue
        const alpha = cosL * 0.17
        ctx.strokeStyle = `rgba(167,139,250,${alpha.toFixed(3)})`
        ctx.lineWidth = 0.7
        const bulge = R * Math.sin(lng)
        ctx.beginPath()
        ctx.moveTo(CX + bulge * 0.06, CY - R)
        ctx.bezierCurveTo(
          CX + bulge * 1.06, CY - R * 0.5,
          CX + bulge * 1.06, CY + R * 0.5,
          CX + bulge * 0.06, CY + R
        )
        ctx.stroke()
      }

      // ── Full Baral logo — drawn natively (no SVG text → canvas limitation) ──
      const logoFace = Math.cos(logoAngle)
      if (logoFace > -0.08) {
        const faceAlpha = Math.max(0, logoFace) * 0.95
        const logoX = CX + Math.sin(logoAngle) * R * 0.28
        const logoY = CY
        drawLogo(logoFace, faceAlpha, logoX, logoY)
      }

      // Specular highlight
      const spec = ctx.createRadialGradient(
        CX - R * 0.35, CY - R * 0.36, 0,
        CX - R * 0.22, CY - R * 0.26, R * 0.68
      )
      spec.addColorStop(0,    'rgba(255,255,255,0.22)')
      spec.addColorStop(0.28, 'rgba(255,255,255,0.06)')
      spec.addColorStop(1,    'transparent')
      ctx.fillStyle = spec
      ctx.fillRect(CX - R, CY - R, R * 2, R * 2)

      // Lens flare
      const lfR = R * 0.065
      const lfX = CX - R * 0.40
      const lfY = CY - R * 0.40
      const lf  = ctx.createRadialGradient(lfX, lfY, 0, lfX, lfY, lfR)
      lf.addColorStop(0,   'rgba(255,255,255,0.65)')
      lf.addColorStop(0.4, 'rgba(255,255,255,0.14)')
      lf.addColorStop(1,   'transparent')
      ctx.fillStyle = lf
      ctx.beginPath()
      ctx.arc(lfX, lfY, lfR, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      // Atmosphere rim
      ctx.beginPath()
      ctx.arc(CX, CY, R + 1.5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(196,181,253,0.52)'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(CX, CY, R + 7, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(139,92,246,0.11)'
      ctx.lineWidth = 9
      ctx.stroke()

      drawRing(false)

      // ── Asteroids ──
      for (const ast of asteroids) {
        ast.angle += ast.speed
        const ox = Math.cos(ast.angle) * ast.orbitRX
        const oy = Math.sin(ast.angle) * ast.orbitRY
        const x  = CX + ox * ast.tiltCos - oy * ast.tiltSin
        const y  = CY + ox * ast.tiltSin + oy * ast.tiltCos

        ast.trail.push({ x, y })
        if (ast.trail.length > 16) ast.trail.shift()

        if (ast.trail.length > 2) {
          for (let t = 1; t < ast.trail.length; t++) {
            const ta = (t / ast.trail.length) * 0.52
            ctx.beginPath()
            ctx.moveTo(ast.trail[t - 1].x, ast.trail[t - 1].y)
            ctx.lineTo(ast.trail[t].x,     ast.trail[t].y)
            ctx.strokeStyle = `rgba(${ast.r},${ast.g},${ast.b},${ta.toFixed(3)})`
            ctx.lineWidth = ast.size * 0.42 * (t / ast.trail.length)
            ctx.lineCap = 'round'
            ctx.stroke()
          }
        }

        const halo = ctx.createRadialGradient(x, y, 0, x, y, ast.size * 3.2)
        halo.addColorStop(0, `rgba(${ast.r},${ast.g},${ast.b},0.68)`)
        halo.addColorStop(1, 'transparent')
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(x, y, ast.size * 3.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(${ast.r},${ast.g},${ast.b},0.96)`
        ctx.beginPath()
        ctx.arc(x, y, ast.size, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [size])

  return <canvas ref={canvasRef} aria-hidden="true" />
}
