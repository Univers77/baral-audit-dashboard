'use client'

import type { AuditResult } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

const SATELLITE_CONFIG = [
  { key: 'performance' as const, label: 'Performance', color: 'var(--pulsar)', ring: 0, angle: 0,   dur: 34 },
  { key: 'seo'         as const, label: 'SEO',         color: 'var(--nova)',   ring: 1, angle: 120, dur: 46 },
  { key: 'a11y'        as const, label: 'Accesibilidad', color: 'var(--star)', ring: 2, angle: 210, dur: 58 },
  { key: 'conversion'  as const, label: 'Conversión',  color: 'var(--quasar)',ring: 1, angle: 300, dur: 46 },
] as const

const RING_RADII = [30, 40, 49]

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

export function Hero({ scanResult, ga4Data }: { scanResult: AuditResult | null; ga4Data?: GA4Metrics | null }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!scanResult) { setProgress(0); return }
    setProgress(0)
    let raf = 0
    const start = performance.now()
    const dur = 1600
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [scanResult])

  // ── Empty state ──────────────────────────────────────────────
  if (!scanResult) {
    return (
      <section id="hero" className="relative px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-14">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center py-10">
          <div
            className="glass text-muted-foreground flex items-center gap-2.5 rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.16em]"
            style={{ border: '1px solid var(--border)' }}
          >
            <span className="size-1.5 rounded-full" style={{ background: 'var(--muted-foreground)' }} />
            RADIOGRAFÍA EN ESPERA
          </div>
          <h1 className="font-display max-w-3xl text-[clamp(2rem,5.5vw,4rem)] leading-[0.98] font-semibold tracking-[-0.02em] text-balance">
            Su sitio ya le está diciendo algo
            <br />
            <span className="text-gradient-quasar">a cada visitante</span>
            <span className="animate-caret text-primary">_</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-[16px] leading-relaxed text-pretty">
            La pregunta es si dice lo que usted quiere. Ingrese la dirección arriba y en segundos verá lo que
            ve Google, lo que percibe su cliente y lo que hoy le está costando oportunidades.
          </p>
        </div>
      </section>
    )
  }

  // ── Derive data from scan result ─────────────────────────────
  const scoreTargets = {
    performance: scanResult.scores.performance,
    seo:         scanResult.scores.seo,
    a11y:        scanResult.scores.accessibility,
    conversion:  scanResult.scores.conversion,
  }

  const overall = Math.round(scanResult.scores.overall * progress)
  const R = 132
  const CIRC = 2 * Math.PI * R

  const totalFindings = scanResult.findings.length + scanResult.compactFindings.length
  const p0Count = scanResult.findings.filter(f => f.priority === 'P0').length
  const p1Count = scanResult.findings.filter(f => f.priority === 'P1').length
  const opportunityCount =
    scanResult.findings.filter(f => f.priority === 'P2' || f.priority === 'P3').length +
    scanResult.compactFindings.filter(f => f.priority === 'P2' || f.priority === 'P3').length

  const businessRisk = Math.min(99, p0Count * 20 + p1Count * 8 + 10)
  const healthScore = scanResult.scores.overall
  const evidenceConfidence =
    scanResult.claudeEnrichment?.dataConfidence === 'ALTA' ? 92
    : scanResult.claudeEnrichment?.dataConfidence === 'MEDIA' ? 75
    : 65

  return (
    <section id="hero" className="relative px-5 pt-16 pb-10 sm:px-8 sm:pt-20 sm:pb-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 text-center">

        {/* Live scan badge */}
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
          DIAGNÓSTICO EN VIVO · {scanResult.domain.toUpperCase()} · {formatDate(scanResult.scanDate).toUpperCase()}
        </div>

        {/* GA4 connected badge */}
        {ga4Data && (
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em]"
            style={{ background: 'oklch(0.86 0.19 155 / 0.08)', border: '1px solid oklch(0.86 0.19 155 / 0.3)', color: 'var(--nova)' }}
          >
            <span className="size-1.5 rounded-full bg-[var(--nova)]" />
            GA4 CONECTADO · {ga4Data.sessions.toLocaleString()} SESIONES · {ga4Data.engagementRate}% ENGAGEMENT
          </div>
        )}

        <h1 className="font-display max-w-4xl text-[clamp(2.4rem,6.4vw,4.6rem)] leading-[0.98] font-semibold tracking-[-0.02em] text-balance">
          Tu web cartografiada como
          <br />
          <span className="text-gradient-quasar">un sistema estelar</span>
          <span className="animate-caret text-primary">_</span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-[17px] leading-relaxed text-pretty">
          {totalFindings} hallazgos orbitando tu dominio · {p0Count} supernovas críticas · {opportunityCount}{' '}
          oportunidades latentes detectadas automáticamente.
        </p>

        {/* Scope disclaimer */}
        <div
          className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 font-mono text-[11px]"
          style={{
            background: 'oklch(0.85 0.13 88 / 0.07)',
            border: '1px solid oklch(0.85 0.13 88 / 0.25)',
            color: 'oklch(0.85 0.13 88)',
          }}
        >
          <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
          <span>
            Análisis automático de <strong>{scanResult.url}</strong> · Nivel ESTÁNDAR · Homepage analizada
          </span>
        </div>

        {/* ——— Orbital score system ——— */}
        <div className="relative mt-3 aspect-square w-full max-w-[min(28rem,86vw)]">
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
          {SATELLITE_CONFIG.map((s) => {
            const target = scoreTargets[s.key]
            const value = Math.round(target * progress)
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
                background: 'radial-gradient(circle at 35% 30%, oklch(0.32 0.06 288), oklch(0.15 0.03 278) 70%)',
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

        {/* Tripartite scoring */}
        <div
          className="glass flex w-full max-w-lg flex-col gap-3 rounded-2xl px-5 py-4"
          style={{ border: '1px solid oklch(0.8 0.16 305 / 0.25)' }}
        >
          <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground/70">
            SCORING TRIPARTITO
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'HEALTH SCORE',   value: healthScore,          color: 'var(--pulsar)', note: 'Calidad técnica' },
              { label: 'BUSINESS RISK',  value: businessRisk,         color: 'var(--solar)',  note: 'Riesgo activo' },
              { label: 'EVIDENCE CONF.', value: evidenceConfidence,   color: 'var(--nova)',   note: 'Confianza auditoría' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="font-mono text-2xl font-bold tabular-nums leading-none" style={{ color: s.color }}>
                  {s.value}
                </span>
                <span className="font-mono text-[8px] tracking-[0.16em] text-muted-foreground/60 text-center leading-tight">
                  {s.label}
                </span>
                <span className="text-[10px] text-muted-foreground/50 text-center leading-tight">{s.note}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[9px] text-muted-foreground/40 text-center">
            Risk = P0×20 + P1×8 · Nunca un solo promedio
          </p>
        </div>

        {/* Tech stack */}
        {scanResult.tech.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-2">
            {scanResult.tech.map((t) => (
              <li
                key={t.label}
                className="rounded-full px-3.5 py-1.5 font-mono text-[11px]"
                title={t.note || undefined}
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
        )}
      </div>
    </section>
  )
}
