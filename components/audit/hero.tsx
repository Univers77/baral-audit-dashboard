'use client'

import { CosmicButton } from '@/components/cosmos/primitives'
import { counts, opportunityCount, scores, site, tech, totalFindings } from '@/lib/audit-data'
import { Crosshair, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

const SATELLITES = [
  { key: 'performance', label: 'Performance', target: scores.performance, color: 'var(--pulsar)', ring: 0, angle: 0, dur: 34 },
  { key: 'seo', label: 'SEO', target: scores.seo, color: 'var(--nova)', ring: 1, angle: 120, dur: 46 },
  { key: 'a11y', label: 'Accesibilidad', target: scores.accessibility, color: 'var(--star)', ring: 2, angle: 210, dur: 58 },
  { key: 'conversion', label: 'Conversión', target: scores.conversion, color: 'var(--quasar)', ring: 1, angle: 300, dur: 46 },
] as const

const RING_RADII = [30, 40, 49] // % of container

export function Hero() {
  const [domain, setDomain] = useState(site.url)
  const [input, setInput] = useState('')
  const [runId, setRunId] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0) // 0..1 animation driver

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 1600
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setScanning(false)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [runId])

  const analyze = () => {
    const v = input.trim()
    if (!v) return
    setDomain(v.replace(/^https?:\/\//, '').replace(/\/$/, ''))
    setInput('')
    setScanning(true)
    setProgress(0)
    setRunId((n) => n + 1)
  }

  const overall = Math.round(scores.overall * progress)
  const R = 132
  const CIRC = 2 * Math.PI * R

  return (
    <section id="hero" className="relative px-5 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 text-center">
        <div
          className="glass text-muted-foreground flex items-center gap-2.5 rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.16em]"
          style={{ border: '1px solid var(--border)' }}
        >
          <span className="relative flex size-1.5">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{ background: 'var(--nova)', animation: 'pulse-ring 2.2s ease-out infinite' }}
            />
            <span className="relative size-1.5 rounded-full" style={{ background: 'var(--nova)' }} />
          </span>
          DIAGNÓSTICO INTEGRAL · {domain.toUpperCase()} · {site.date.toUpperCase()}
        </div>

        <h1 className="font-display max-w-4xl text-[clamp(2.4rem,6.4vw,4.6rem)] leading-[0.98] font-semibold tracking-[-0.02em] text-balance">
          Tu web cartografiada como
          <br />
          <span className="text-gradient-quasar">un sistema estelar</span>
          <span className="animate-caret text-primary">_</span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-[17px] leading-relaxed text-pretty">
          {totalFindings} hallazgos orbitando tu dominio · {counts.P0} supernovas críticas · {opportunityCount}{' '}
          oportunidades latentes, contrastadas contra la competencia más cercana y peligrosa.
        </p>

        {/* URL scanner */}
        <div
          className="glass flex w-full max-w-md items-center gap-2 rounded-full p-1.5 pl-5"
          style={{ border: '1px solid var(--border)' }}
        >
          <Crosshair aria-hidden className="text-muted-foreground/60 size-4 shrink-0" />
          <label htmlFor="scan-url" className="sr-only">
            Dominio a analizar
          </label>
          <input
            id="scan-url"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) analyze()
            }}
            placeholder="https://tu-sitio.com"
            className="placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent font-mono text-[13px] outline-none"
          />
          <CosmicButton onClick={analyze} className="shrink-0 px-5 py-2.5 text-[13px]">
            {scanning ? 'Escaneando…' : 'Trazar órbita'}
          </CosmicButton>
        </div>

        {/* ——— Orbital score system ——— */}
        <div className="relative mt-6 aspect-square w-full max-w-[min(34rem,86vw)]">
          {/* halo */}
          <div
            aria-hidden
            className="animate-slow-spin absolute inset-[8%] rounded-full opacity-45 blur-3xl"
            style={{
              background:
                'conic-gradient(from 0deg, oklch(0.8 0.16 305), oklch(0.88 0.14 195), oklch(0.86 0.19 155), oklch(0.8 0.16 305))',
            }}
          />

          {/* orbit rings */}
          {RING_RADII.map((r, i) => (
            <div
              key={r}
              aria-hidden
              className="absolute rounded-full"
              style={{
                inset: `${50 - r}%`,
                border: `1px ${i === 1 ? 'dashed' : 'solid'} oklch(0.9 0.03 285 / ${0.16 - i * 0.03})`,
                transform: `rotateX(${8 + i * 4}deg)`,
              }}
            />
          ))}

          {/* satellites on orbit */}
          {SATELLITES.map((s) => {
            const value = Math.round(s.target * progress)
            const r = RING_RADII[s.ring]
            return (
              <div
                key={s.key}
                className="absolute inset-0"
                style={{
                  animation: `slow-spin ${s.dur}s linear infinite`,
                  transform: `rotate(${s.angle}deg)`,
                }}
              >
                <div
                  className="absolute top-1/2 left-1/2"
                  style={{ transform: `translate(-50%, -50%) translateX(${r}%)` }}
                >
                  <div
                    className="glass flex flex-col items-center gap-0.5 rounded-2xl px-2.5 py-2"
                    style={{
                      animation: `reverse-spin ${s.dur}s linear infinite`,
                      border: `1px solid color-mix(in oklch, ${s.color} 45%, transparent)`,
                      boxShadow: `0 0 26px -6px color-mix(in oklch, ${s.color} 55%, transparent)`,
                    }}
                  >
                    <span className="font-mono text-base leading-none font-bold" style={{ color: s.color }}>
                      {value}
                    </span>
                    <span className="text-muted-foreground text-[9px] leading-none tracking-wide whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* core gauge */}
          <div className="absolute inset-[27%] grid place-items-center">
            <svg viewBox="0 0 300 300" className="absolute inset-0 size-full -rotate-90">
              <defs>
                <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.88 0.14 195)" />
                  <stop offset="55%" stopColor="oklch(0.8 0.16 305)" />
                  <stop offset="100%" stopColor="oklch(0.86 0.19 155)" />
                </linearGradient>
              </defs>
              <circle cx="150" cy="150" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="150"
                cy="150"
                r={R}
                fill="none"
                stroke="url(#coreGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC - (overall / 100) * CIRC}
                style={{ filter: 'drop-shadow(0 0 12px oklch(0.8 0.16 305 / 0.65))' }}
              />
            </svg>
            <div
              className="absolute inset-[7%] rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, oklch(0.32 0.06 288), oklch(0.15 0.03 278) 70%)',
                boxShadow: 'inset 0 0 60px oklch(0.62 0.24 300 / 0.3)',
              }}
            />
            <div className="relative flex flex-col items-center">
              <span className="font-mono text-[clamp(2.6rem,7vw,3.8rem)] leading-none font-bold tabular-nums">
                {overall}
              </span>
              <span className="text-muted-foreground/80 mt-1.5 font-mono text-[10px] tracking-[0.22em]">
                SALUD GENERAL
              </span>
              <span className="mt-2 font-mono text-[10px]" style={{ color: 'var(--solar)' }}>
                {overall < 60 ? 'ÓRBITA INESTABLE' : 'ÓRBITA ESTABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* tech badges */}
        <ul className="flex flex-wrap justify-center gap-2">
          {tech.map((t) => (
            <li
              key={t.label}
              className="rounded-full px-3.5 py-1.5 font-mono text-[11px]"
              style={{
                background: t.crit ? 'oklch(0.72 0.2 15 / 0.1)' : 'oklch(0.24 0.045 280 / 0.5)',
                border: `1px solid ${t.crit ? 'oklch(0.72 0.2 15 / 0.42)' : 'var(--border)'}`,
                color: t.crit ? 'var(--pulsar)' : 'var(--muted-foreground)',
              }}
            >
              {t.crit && <TriangleAlert aria-hidden className="mr-1 inline size-3 align-[-2px]" />}
              {t.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
