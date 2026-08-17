'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import {
  axisKeys,
  axisLabels,
  compareColumns,
  compareRows,
  competitiveBenchmarkNote,
  constellationSets,
  references,
  type AxisKey,
} from '@/lib/audit-data'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const CX = 250
const CY = 210
const MAX_R = 138

const SERIES = [
  { key: 'client', label: 'Tu sitio', color: 'var(--quasar)', fill: 'oklch(0.8 0.16 305 / 0.16)', dash: '' },
  { key: 'avg', label: 'Benchmark estimado', color: 'var(--star)', fill: 'oklch(0.88 0.14 195 / 0.08)', dash: '5 4' },
  { key: 'top', label: 'Referencia aspiracional', color: 'var(--nova)', fill: 'oklch(0.86 0.19 155 / 0.06)', dash: '2 6' },
] as const

function polar(r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

function pointsFor(values: Record<AxisKey, number>) {
  return axisKeys
    .map((k, i) => {
      const p = polar((values[k] / 100) * MAX_R, (360 / axisKeys.length) * i)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(' ')
}

export function CompetitiveSection() {
  const [visible, setVisible] = useState<Record<string, boolean>>({ client: true, avg: true, top: false })
  const [hoverAxis, setHoverAxis] = useState<number | null>(null)

  const client = constellationSets.client
  const avg = constellationSets.avg

  return (
    <section id="competencia" className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Mecánica orbital"
            title={
              <>
                Tu posición frente a los cuerpos <span className="text-gradient-quasar">más cercanos y peligrosos</span>
              </>
            }
            description="Selección editorial de referencias del mercado digital boliviano. Los ejes del radar son benchmarks estimados de la industria — cada competidor requiere auditoría propia para obtener datos medidos."
          />
        </Reveal>

        {/* Radar */}
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <Reveal delay={80}>
            <div
              className="glass relative rounded-3xl p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <div
                aria-hidden
                className="animate-slow-spin absolute inset-16 rounded-full opacity-25 blur-3xl"
                style={{
                  background:
                    'conic-gradient(from 90deg, oklch(0.8 0.16 305 / 0.6), transparent, oklch(0.88 0.14 195 / 0.5), transparent)',
                }}
              />
              <svg
                viewBox="0 0 500 420"
                className="relative w-full"
                role="img"
                aria-label="Radar comparativo entre tu sitio, el competidor promedio y la referencia top"
              >
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <polygon
                    key={f}
                    points={axisKeys
                      .map((_, i) => {
                        const p = polar(MAX_R * f, (360 / axisKeys.length) * i)
                        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                ))}

                {axisKeys.map((_, i) => {
                  const p = polar(MAX_R, (360 / axisKeys.length) * i)
                  const isHover = hoverAxis === i
                  return (
                    <line
                      key={i}
                      x1={CX}
                      y1={CY}
                      x2={p.x}
                      y2={p.y}
                      stroke={isHover ? 'var(--quasar)' : 'var(--border)'}
                      strokeWidth={isHover ? 1.5 : 1}
                    />
                  )
                })}

                {SERIES.filter((s) => visible[s.key]).map((s) => (
                  <polygon
                    key={s.key}
                    points={pointsFor(constellationSets[s.key])}
                    fill={s.fill}
                    stroke={s.color}
                    strokeWidth={s.key === 'client' ? 2.5 : 1.8}
                    strokeDasharray={s.dash || undefined}
                    style={{ filter: s.key === 'client' ? 'drop-shadow(0 0 10px oklch(0.8 0.16 305 / 0.5))' : undefined }}
                  />
                ))}

                {/* client vertices */}
                {visible.client &&
                  axisKeys.map((k, i) => {
                    const p = polar((client[k] / 100) * MAX_R, (360 / axisKeys.length) * i)
                    return (
                      <circle
                        key={k}
                        cx={p.x}
                        cy={p.y}
                        r={hoverAxis === i ? 6 : 4}
                        fill="var(--quasar)"
                        style={{ transition: 'r 0.2s ease', filter: 'drop-shadow(0 0 8px oklch(0.8 0.16 305 / 0.8))' }}
                      />
                    )
                  })}

                {axisKeys.map((k, i) => {
                  const p = polar(MAX_R + 26, (360 / axisKeys.length) * i)
                  const anchor = p.x < CX - 10 ? 'end' : p.x > CX + 10 ? 'start' : 'middle'
                  const delta = client[k] - avg[k]
                  return (
                    <g
                      key={k}
                      onMouseEnter={() => setHoverAxis(i)}
                      onMouseLeave={() => setHoverAxis(null)}
                      style={{ cursor: 'default' }}
                    >
                      <rect x={p.x - 46} y={p.y - 16} width="92" height="30" fill="transparent" />
                      <text
                        x={p.x}
                        y={p.y}
                        fill={hoverAxis === i ? 'var(--foreground)' : 'var(--muted-foreground)'}
                        fontSize="12"
                        fontFamily="var(--font-sans)"
                        textAnchor={anchor}
                      >
                        {axisLabels[i]}
                      </text>
                      <text
                        x={p.x}
                        y={p.y + 13}
                        fill={delta >= 0 ? 'var(--nova)' : 'var(--pulsar)'}
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                        textAnchor={anchor}
                      >
                        {delta >= 0 ? '+' : ''}
                        {delta}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                {SERIES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setVisible((v) => ({ ...v, [s.key]: !v[s.key] }))}
                    aria-pressed={visible[s.key]}
                    className={cn(
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-300',
                      visible[s.key] ? 'opacity-100' : 'opacity-45 hover:opacity-75',
                    )}
                    style={{
                      background: visible[s.key] ? 'oklch(1 0 0 / 0.04)' : 'transparent',
                      border: `1px solid ${visible[s.key] ? 'var(--border)' : 'transparent'}`,
                    }}
                  >
                    <span
                      className="size-3 shrink-0 rounded-[3px]"
                      style={{
                        background: s.color,
                        boxShadow: visible[s.key] ? `0 0 12px 2px ${s.color}` : 'none',
                      }}
                    />
                    <span className="text-[14px] font-medium">{s.label}</span>
                    <span className="text-muted-foreground/60 ml-auto font-mono text-[10px]">
                      {visible[s.key] ? 'VISIBLE' : 'OCULTO'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Axis glossary */}
              <div className="flex flex-col gap-1.5 mt-1">
                {[
                  { axis: 'Velocidad', icon: '⚡', explain: '¿Cuánto espera el visitante para ver tu sitio? Cada segundo de espera = más rebotes.' },
                  { axis: 'SEO', icon: '🔍', explain: '¿Google te encuentra antes que a tus competidores? Define cuánto tráfico gratuito recibes.' },
                  { axis: 'Confianza', icon: '🛡️', explain: 'HTTPS, reseñas, certificados, datos de contacto claros. Sin esto, el visitante se va.' },
                  { axis: 'UX', icon: '🖥️', explain: '¿Es fácil navegar en móvil? El 70% de tus visitantes llegan desde el celular.' },
                  { axis: 'Conversión', icon: '🎯', explain: '¿Hay CTAs claros? Sin botones visibles, el interesado no sabe cómo contactarte.' },
                  { axis: 'Contenido', icon: '📄', explain: '¿Explica claramente qué ofreces y para quién? El copy decide si el visitante se queda.' },
                ].map((a) => (
                  <div key={a.axis} className="flex items-start gap-2 rounded-xl px-3 py-1.5" style={{ background: 'oklch(1 0 0 / 0.03)' }}>
                    <span className="text-[12px] shrink-0 mt-0.5">{a.icon}</span>
                    <div>
                      <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--star)' }}>{a.axis.toUpperCase()}</span>
                      <span className="text-muted-foreground/70 text-[11px]"> — {a.explain}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty mt-2">
                Tu sitio supera el benchmark estimado en <span className="text-nova font-semibold">SEO y contenido</span>, pero cae por debajo en <span className="text-pulsar font-semibold">velocidad, confianza y UX</span> — exactamente donde los competidores te están ganando tráfico.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Benchmark table */}
        <Reveal delay={80} className="mt-10 block">
          <div
            className="glass overflow-hidden rounded-3xl"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <caption className="text-muted-foreground/70 border-border/70 border-b px-5 py-4 text-left font-mono text-[11px] tracking-[0.16em]">
                  BENCHMARKS DIRECTOS · LÍDER / GAP POR MÉTRICA
                  <span className="ml-3 font-mono text-[9px] tracking-normal normal-case" style={{ color: 'oklch(0.85 0.13 88 / 0.7)' }}>
                    · N/M = sitio no respondió durante el escaneo
                  </span>
                </caption>
                <thead>
                  <tr>
                    <td colSpan={5} className="px-5 py-3 text-[11.5px] leading-relaxed" style={{ color: 'var(--muted-foreground)', background: 'oklch(0.88 0.14 195 / 0.05)', borderBottom: '1px solid var(--border)' }}>
                      <strong style={{ color: 'var(--star)' }}>Metodología: </strong>{competitiveBenchmarkNote}
                    </td>
                  </tr>
                  <tr className="border-border/70 border-b">
                    <th scope="col" className="text-muted-foreground/60 px-5 py-3 font-mono text-[10px] tracking-[0.14em]">
                      MÉTRICA
                    </th>
                    {compareColumns.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        className="px-4 py-3 text-center font-mono text-[10px] tracking-[0.14em]"
                        style={{
                          color: c.key === 'client' ? 'var(--quasar)' : 'var(--muted-foreground)',
                          background: c.key === 'client' ? 'oklch(0.8 0.16 305 / 0.07)' : undefined,
                        }}
                      >
                        {c.label}
                        <span className="text-muted-foreground/50 mt-1 block text-[9px] font-normal tracking-normal normal-case">
                          {c.threat}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => {
                    const values = [row.client, row.a, row.b, row.top]
                    const numeric = values.filter((v): v is number => v !== null)
                    const max = numeric.length ? Math.max(...numeric) : 0
                    const min = numeric.length ? Math.min(...numeric) : 0
                    // TTFB (ms): menor es mejor — invierte la polaridad líder/gap y la barra
                    const lowerIsBetter = row.unit === 'ms'
                    return (
                      <tr key={row.label} className="border-border/50 hover:bg-foreground/[0.03] border-b transition-colors">
                        <th scope="row" className="text-muted-foreground px-5 py-4 text-[13.5px] font-medium">
                          {row.label}
                        </th>
                        {values.map((v, i) => {
                          if (v === null) {
                            return (
                              <td key={i} className="px-4 py-4 text-center align-middle">
                                <span className="font-mono text-[12px] font-bold" style={{ color: 'var(--muted-foreground)' }}>N/M</span>
                                <span className="mt-1 block font-mono text-[9px]" style={{ color: 'oklch(0.72 0.03 272 / 0.5)' }}>no medido</span>
                              </td>
                            )
                          }
                          const isLeader = lowerIsBetter ? v === min : v === max
                          const isGap = lowerIsBetter ? v === max : v === min
                          const badgeColor = isLeader ? 'var(--nova)' : 'var(--pulsar)'
                          const barPct = lowerIsBetter
                            ? (max === min ? 100 : ((max - v) / (max - min)) * 100)
                            : (v / max) * 100
                          return (
                            <td
                              key={i}
                              className="px-4 py-4 text-center align-middle"
                              style={{ background: i === 0 ? 'oklch(0.8 0.16 305 / 0.06)' : undefined }}
                            >
                              <span className="font-mono text-[15px] font-bold tabular-nums">
                                {v}
                                <span className="text-muted-foreground/50 text-[10px]">{row.unit}</span>
                              </span>
                              <span
                                className="mx-auto mt-2 block h-1 max-w-16 overflow-hidden rounded-full"
                                style={{ background: 'oklch(1 0 0 / 0.07)' }}
                              >
                                <span
                                  className="block h-full rounded-full"
                                  style={{
                                    width: `${barPct}%`,
                                    background: i === 0 ? 'var(--quasar)' : 'oklch(0.72 0.03 272)',
                                  }}
                                />
                              </span>
                              {(isLeader || isGap) && (
                                <span
                                  className="mt-2 inline-block rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
                                  style={{
                                    background: isLeader ? 'oklch(0.86 0.19 155 / 0.12)' : 'oklch(0.72 0.2 15 / 0.12)',
                                    color: badgeColor,
                                  }}
                                >
                                  {isLeader ? 'LÍDER' : 'GAP'}
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Reference DNA */}
        <div className="mt-10">
          <Reveal>
            <div className="text-muted-foreground/60 mb-5 font-mono text-[11px] tracking-[0.18em]">
              REFERENCE DNA · CUERPOS EN TU CAMPO GRAVITATORIO
            </div>
          </Reveal>
          <p className="text-muted-foreground/50 mb-5 font-mono text-[10px] leading-relaxed">
            Dominios reales verificados por fetch en vivo el 17/08/2026. El score es el mismo Score Global automatizado de la tabla de arriba (no un índice editorial). ADMIRE/ADAPT/AVOID son observación cualitativa del equipo, marcada como tal — no son datos medidos.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {references.map((r, i) => (
              <Reveal key={r.domain} delay={i * 110}>
                <TiltCard glow="oklch(0.88 0.14 195 / 0.28)" className="glass h-full rounded-3xl p-5">
                  <div
                    className="relative grid h-24 place-items-center overflow-hidden rounded-2xl"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 25%, oklch(0.3 0.06 288), oklch(0.17 0.03 278) 70%)',
                    }}
                  >
                    <span
                      aria-hidden
                      className="animate-reverse-spin absolute inset-3 rounded-full border border-dashed"
                      style={{ borderColor: 'oklch(0.88 0.14 195 / 0.3)' }}
                    />
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground relative font-mono text-[11px] underline decoration-dotted underline-offset-2 transition-colors"
                    >
                      {r.domain} ↗
                    </a>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-accent font-mono text-[10px] tracking-[0.12em]">{r.orbit.toUpperCase()}</span>
                    {r.status === 'medido' ? (
                      <span className="text-muted-foreground/60 font-mono text-[10px]" title="Score Global automatizado — mismo dato de la tabla de benchmarks">
                        SCORE {r.score}/100
                      </span>
                    ) : (
                      <span className="font-mono text-[10px]" style={{ color: 'var(--pulsar)' }} title="El dominio no respondió durante el escaneo automatizado">
                        SIN DATOS
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.07)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: r.score !== null ? `${r.score}%` : '100%',
                        background: r.score !== null
                          ? 'linear-gradient(90deg, oklch(0.88 0.14 195), oklch(0.8 0.16 305))'
                          : 'repeating-linear-gradient(45deg, oklch(0.72 0.2 15 / 0.35) 0 6px, transparent 6px 12px)',
                      }}
                    />
                  </div>

                  <ul className="mt-4 flex flex-col gap-2">
                    {[
                      { tag: 'ADMIRE', value: r.admire, color: 'var(--nova)' },
                      { tag: 'ADAPT', value: r.adapt, color: 'var(--star)' },
                      { tag: 'AVOID', value: r.avoid, color: 'var(--pulsar)' },
                    ].map((row) => (
                      <li key={row.tag} className="flex items-center gap-2 text-[12.5px]">
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
                          style={{ background: `color-mix(in oklch, ${row.color} 14%, transparent)`, color: row.color }}
                        >
                          {row.tag}
                        </span>
                        <span className="text-muted-foreground">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
