'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import type { AuditResult } from '@/lib/scanner/types'
import { TrendingDown, TrendingUp } from 'lucide-react'

type Tile = { label: string; value: string; benchmark: string; good: boolean; pct: number }

function tilesFromResult(r: AuditResult): Tile[] {
  const altPct = r.raw.totalImages > 0
    ? Math.round(100 - (r.raw.imagesWithoutAlt / r.raw.totalImages) * 100)
    : 100
  const ttfbPct = Math.min(100, Math.max(0, Math.round((1 - r.raw.ttfb / 3000) * 100)))

  return [
    {
      label: 'Performance',
      value: `${r.scores.performance}`,
      benchmark: '90+',
      good: r.scores.performance >= 80,
      pct: r.scores.performance,
    },
    {
      label: 'SEO Score',
      value: `${r.scores.seo}`,
      benchmark: '90+',
      good: r.scores.seo >= 80,
      pct: r.scores.seo,
    },
    {
      label: 'Accesibilidad',
      value: `${r.scores.accessibility}`,
      benchmark: '90+',
      good: r.scores.accessibility >= 80,
      pct: r.scores.accessibility,
    },
    {
      label: 'Conversión',
      value: `${r.scores.conversion}`,
      benchmark: '70+',
      good: r.scores.conversion >= 70,
      pct: r.scores.conversion,
    },
    {
      label: 'TTFB',
      value: `${r.raw.ttfb}ms`,
      benchmark: '<800ms',
      good: r.raw.ttfb < 800,
      pct: ttfbPct,
    },
    {
      label: 'Imgs sin alt',
      value: r.raw.totalImages > 0 ? `${r.raw.imagesWithoutAlt}/${r.raw.totalImages}` : '0',
      benchmark: '0',
      good: r.raw.imagesWithoutAlt === 0,
      pct: altPct,
    },
    {
      label: 'HTTPS',
      value: r.raw.isHttps ? 'Activo' : 'Ausente',
      benchmark: 'HTTPS',
      good: r.raw.isHttps,
      pct: r.raw.isHttps ? 100 : 0,
    },
    {
      label: 'Schema.org',
      value: r.raw.hasSchema ? 'Presente' : 'Ausente',
      benchmark: 'Presente',
      good: r.raw.hasSchema,
      pct: r.raw.hasSchema ? 100 : 0,
    },
  ]
}

export function MetricsSection({ scanResult }: { scanResult: AuditResult | null }) {
  return (
    <section id="metricas" className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Telemetría"
            title={
              <>
                Señales que llegan desde <span className="text-gradient-cool">tu propio sistema</span>
              </>
            }
            description="Lecturas crudas comparadas contra el umbral que el mercado ya considera mínimo. Rojo significa que estás por debajo de la línea de flotación, no que sea difícil de arreglar."
          />
        </Reveal>

        {!scanResult ? (
          <Reveal delay={80}>
            <div
              className="mt-8 rounded-3xl p-12 text-center"
              style={{ border: '1px dashed var(--border)', background: 'oklch(1 0 0 / 0.02)' }}
            >
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/50 mb-3">
                TELEMETRÍA · SIN DATOS
              </p>
              <p className="text-muted-foreground text-[14px]">
                Las métricas aparecen aquí tras escanear una URL.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tilesFromResult(scanResult).map((m, i) => {
              const color = m.good ? 'var(--nova)' : 'var(--pulsar)'
              const glow = m.good ? 'oklch(0.86 0.19 155 / 0.35)' : 'oklch(0.72 0.2 15 / 0.4)'
              return (
                <Reveal key={m.label} delay={Math.min(i * 70, 350)}>
                  <TiltCard glow={glow} className="glass h-full rounded-3xl p-5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.14em] uppercase">
                        {m.label}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
                        style={{ background: m.good ? 'oklch(0.86 0.19 155 / 0.12)' : 'oklch(0.72 0.2 15 / 0.12)', color }}
                      >
                        {m.good ? (
                          <TrendingUp aria-hidden className="size-2.5" />
                        ) : (
                          <TrendingDown aria-hidden className="size-2.5" />
                        )}
                        {m.good ? 'OK' : 'GAP'}
                      </span>
                    </div>

                    <div className="mt-5 font-mono text-[2rem] leading-none font-bold tabular-nums" style={{ color }}>
                      {m.value}
                    </div>

                    <div className="text-muted-foreground/60 mt-2 font-mono text-[11px]">
                      benchmark <span className="text-foreground/80">{m.benchmark}</span>
                    </div>

                    <div className="relative mt-5 h-1.5 overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.07)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${m.pct}%`, background: color, boxShadow: `0 0 12px 1px ${glow}` }}
                      />
                      <span
                        aria-hidden
                        className="absolute inset-y-[-4px] w-[2px]"
                        style={{ left: '90%', background: 'oklch(0.96 0.01 265 / 0.45)' }}
                      />
                    </div>
                    <div className="text-muted-foreground/50 mt-2 flex justify-between font-mono text-[9px]">
                      <span>ahora</span>
                      <span>objetivo</span>
                    </div>
                  </TiltCard>
                </Reveal>
              )
            })}
          </div>
        )}

        {scanResult?.coverage?.pillars ? <CoveragePanel result={scanResult} /> : null}
      </div>
    </section>
  )
}

/**
 * De qué se sostiene cada puntaje.
 *
 * Un 45 en accesibilidad y un 45 en rendimiento no valen lo mismo: el primero
 * se apoya en 5 criterios de 56 posibles. Presentarlos con la misma autoridad
 * es lo que hace que un informe automático se lea como un veredicto cuando es
 * una muestra. Ninguna herramienta comercial declara esto.
 */
function CoveragePanel({ result }: { result: AuditResult }) {
  const { pillars, overallPct } = result.coverage

  return (
    <Reveal delay={120}>
      <div className="glass mt-4 rounded-3xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-mono text-[11px] tracking-[0.14em] uppercase">
            De qué se sostienen estos puntajes
          </h3>
          <span className="text-muted-foreground/60 font-mono text-[11px]">
            cobertura media {overallPct}%
          </span>
        </div>

        <p className="text-muted-foreground/70 mt-2 text-[13px]">
          Un chequeo que no se pudo ejecutar no cuenta como aprobado: queda fuera del puntaje y se
          declara aquí.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(p => {
            const pct = p.total === 0 ? 0 : Math.round((p.run / p.total) * 100)
            const color = pct >= 60 ? 'var(--nova)' : pct >= 25 ? 'var(--solar)' : 'var(--pulsar)'
            return (
              <div
                key={p.key}
                className="rounded-2xl p-4"
                style={{ border: '1px solid var(--border)', background: 'oklch(1 0 0 / 0.02)' }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold">{p.label}</span>
                  <span className="font-mono text-[12px] tabular-nums" style={{ color }}>
                    {p.run}/{p.total}
                  </span>
                </div>

                <div
                  className="relative mt-3 h-1 overflow-hidden rounded-full"
                  style={{ background: 'oklch(1 0 0 / 0.07)' }}
                >
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>

                <p className="text-muted-foreground/65 mt-3 text-[12px]">{p.note}</p>
              </div>
            )
          })}
        </div>
      </div>
    </Reveal>
  )
}
