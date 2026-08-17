'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import {
  funnelStages,
  priorityMeta,
  type Priority,
} from '@/lib/audit-data'
import type { AuditResult } from '@/lib/scanner/types'
import { useMemo, useState } from 'react'

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3']

/** Deterministic pseudo-random jitter so the constellation looks organic but stable. */
function jitter(seed: string, spread: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973
  return ((h % 1000) / 1000 - 0.5) * spread
}

type Node = {
  id: string
  title: string
  priority: Priority
  x: number
  y: number
  r: number
  stage: string
}

export function ConstellationMap({
  scanResult,
  onFilter,
  onFocusFinding,
}: {
  scanResult: AuditResult | null
  onFilter: (p: Priority | 'ALL') => void
  onFocusFinding: (id: string) => void
}) {
  const [hover, setHover] = useState<Node | null>(null)

  const nodes = useMemo<Node[]>(() => {
    if (!scanResult) return []
    const W = 1000
    const H = 420
    const stageX = (index: number) => 90 + (index * (W - 180)) / (funnelStages.length - 1)
    const priorityY: Record<Priority, number> = { P0: 84, P1: 172, P2: 268, P3: 356 }

    const detailed: Node[] = scanResult.findings.map((f) => {
      const si = Math.max(0, funnelStages.findIndex((s) => s.key === f.stage))
      return {
        id: f.id,
        title: f.title,
        priority: f.priority as Priority,
        stage: funnelStages[si]?.label ?? f.stage,
        x: stageX(si) + jitter(f.id, 58),
        y: priorityY[f.priority as Priority] + jitter(f.id + 'y', 34),
        r: f.priority === 'P0' ? 8 : 6.4,
      }
    })

    const minor: Node[] = scanResult.compactFindings.map((f, i) => {
      const si = i % funnelStages.length
      return {
        id: f.id,
        title: f.title,
        priority: f.priority as Priority,
        stage: funnelStages[si]?.label ?? String(i),
        x: stageX(si) + jitter(f.id, 96),
        y: priorityY[f.priority as Priority] + jitter(f.id + 'y', 52),
        r: f.priority === 'P2' ? 4.6 : 3.4,
      }
    })

    void H
    return [...detailed, ...minor]
  }, [scanResult])

  /** Links: connect each node to the next node within the same priority band (a constellation line). */
  const links = useMemo(() => {
    const out: { a: Node; b: Node; priority: Priority }[] = []
    for (const p of PRIORITIES) {
      const band = nodes.filter((n) => n.priority === p).sort((a, b) => a.x - b.x)
      for (let i = 0; i < band.length - 1; i++) out.push({ a: band[i], b: band[i + 1], priority: p })
    }
    return out
  }, [nodes])

  return (
    <section id="diagnostico" className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Carta celeste"
            title={
              <>
                La constelación de lo que <span className="text-gradient-cool">necesita atención</span>
              </>
            }
            description="Cada estrella es un problema real detectado en tu sitio. Las que están más arriba son las que más dinero te están costando ahora mismo. Las de la izquierda afectan a quienes aún no te conocen; las de la derecha, a quienes ya están listos para contratarte."
            align="center"
          />
        </Reveal>

        {/* Business-language legend */}
        <Reveal delay={60}>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 mx-auto max-w-4xl">
            {[
              { p: 'P0', name: 'SUPERNOVA', color: 'var(--pulsar)', glow: 'oklch(0.72 0.2 15 / 0.3)', biz: 'Pérdida activa de clientes ahora mismo', sub: 'Requiere acción urgente esta semana' },
              { p: 'P1', name: 'GIGANTE ROJA', color: 'var(--solar)', glow: 'oklch(0.85 0.13 88 / 0.25)', biz: 'Oportunidades que se escapan cada día', sub: 'Impacto alto en conversión y tráfico' },
              { p: 'P2', name: 'ENANA BLANCA', color: 'var(--star)', glow: 'oklch(0.88 0.14 195 / 0.2)', biz: 'Mejoras que suman en próximo sprint', sub: 'Baja complejidad, buen retorno' },
              { p: 'P3', name: 'NEBULOSA', color: 'var(--nova)', glow: 'oklch(0.86 0.19 155 / 0.18)', biz: 'Backlog para cuando crezcas', sub: 'No urgente, pero vale la pena registrar' },
            ].map((item) => (
              <div
                key={item.p}
                className="glass rounded-2xl p-3 flex flex-col gap-1.5"
                style={{ border: `1px solid color-mix(in oklch, ${item.color} 25%, var(--border))` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ background: item.color, boxShadow: `0 0 10px 2px ${item.glow}` }}
                  />
                  <span className="font-mono text-[9px] font-bold tracking-[0.14em]" style={{ color: item.color }}>
                    {item.p} · {item.name}
                  </span>
                </div>
                <p className="text-foreground/90 text-[11.5px] font-medium leading-snug">{item.biz}</p>
                <p className="text-muted-foreground/60 text-[10px] leading-snug">{item.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Stage labels legend */}
        <Reveal delay={80}>
          <div className="mt-3 mx-auto max-w-4xl glass rounded-2xl px-4 py-3" style={{ border: '1px solid var(--border)' }}>
            <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/50 mb-2">ETAPAS DEL VIAJE DEL CLIENTE →</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                { key: 'DISCOVER', es: 'Google / redes sociales te encuentran' },
                { key: 'ARRIVE', es: 'El visitante llega y decide quedarse' },
                { key: 'UNDERSTAND', es: 'Entiende qué ofreces y si le sirve' },
                { key: 'TRUST', es: 'Decide si confiar en tu marca' },
                { key: 'ACTION', es: 'Hace clic en contactar o cotizar' },
                { key: 'CONVERT', es: 'Completa el formulario / llamada' },
              ].map((s) => (
                <span key={s.key} className="text-[10.5px] flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-bold" style={{ color: 'var(--star)' }}>{s.key}</span>
                  <span className="text-muted-foreground/60">=</span>
                  <span className="text-muted-foreground/80">{s.es}</span>
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Star chart */}
        <Reveal delay={120}>
          <div
            className="glass relative mt-8 overflow-hidden rounded-3xl p-3 sm:p-5"
            style={{ border: '1px solid var(--border)' }}
          >
            {!scanResult && (
              <div className="flex items-center justify-center py-20 text-center">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/50 mb-2">
                    CONSTELACIÓN · SIN DATOS
                  </p>
                  <p className="text-muted-foreground text-[13px]">
                    Los hallazgos aparecen mapeados aquí tras escanear una URL.
                  </p>
                </div>
              </div>
            )}
            {scanResult && (
            <div className="relative overflow-x-auto">
              <svg
                viewBox="0 0 1000 420"
                className="min-w-[620px] w-full"
                role="img"
                aria-label="Mapa de constelaciones de hallazgos por magnitud y etapa del funnel"
              >
                {/* magnitude bands */}
                {PRIORITIES.map((p) => {
                  const y = { P0: 84, P1: 172, P2: 268, P3: 356 }[p]
                  return (
                    <g key={p}>
                      <line
                        x1="70"
                        x2="960"
                        y1={y}
                        y2={y}
                        stroke="var(--border)"
                        strokeDasharray="2 8"
                        strokeWidth="1"
                      />
                      <text x="18" y={y + 4} fill={priorityMeta[p].color} fontSize="13" fontFamily="var(--font-mono)">
                        {p}
                      </text>
                    </g>
                  )
                })}

                {/* stage columns */}
                {funnelStages.map((s, i) => {
                  const x = 90 + (i * (1000 - 180)) / (funnelStages.length - 1)
                  return (
                    <g key={s.key}>
                      <line x1={x} x2={x} y1="30" y2="392" stroke="var(--border)" strokeWidth="1" opacity="0.4" />
                      <text
                        x={x}
                        y="410"
                        fill="var(--muted-foreground)"
                        fontSize="11"
                        fontFamily="var(--font-mono)"
                        textAnchor="middle"
                        letterSpacing="1"
                      >
                        {s.label}
                      </text>
                    </g>
                  )
                })}

                {/* constellation lines */}
                {links.map((l, i) => (
                  <line
                    key={`${l.a.id}-${l.b.id}-${i}`}
                    x1={l.a.x}
                    y1={l.a.y}
                    x2={l.b.x}
                    y2={l.b.y}
                    stroke={priorityMeta[l.priority].color}
                    strokeWidth="1"
                    opacity={hover ? (hover.priority === l.priority ? 0.6 : 0.12) : 0.28}
                    strokeDasharray="3 5"
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                ))}

                {/* stars */}
                {nodes.map((n) => {
                  const meta = priorityMeta[n.priority]
                  const isHover = hover?.id === n.id
                  return (
                    <g
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${n.priority} · ${n.title}. Abrir hallazgo ${n.id}`}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(n)}
                      onBlur={() => setHover(null)}
                      onClick={() => onFocusFinding(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onFocusFinding(n.id)
                        }
                      }}
                      className="focus-visible:outline-primary cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <circle cx={n.x} cy={n.y} r={n.r * 3.4} fill={meta.color} opacity={isHover ? 0.22 : 0.09} />
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={isHover ? n.r * 1.5 : n.r}
                        fill={meta.color}
                        style={{
                          transition: 'r 0.25s cubic-bezier(0.16,1,0.3,1)',
                          filter: `drop-shadow(0 0 ${isHover ? 14 : 7}px ${meta.glow})`,
                        }}
                      />
                      <title>{`${n.id} · ${n.title}`}</title>
                    </g>
                  )
                })}
              </svg>
            </div>
            )}

            {/* hover readout */}
            {scanResult && (
              <div className="border-border/70 mt-3 flex min-h-[3.25rem] items-center gap-3 border-t px-2 pt-3">
                {hover ? (
                  <>
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold"
                      style={{ background: priorityMeta[hover.priority].soft, color: priorityMeta[hover.priority].color }}
                    >
                      {hover.priority} · {priorityMeta[hover.priority].magnitude}
                    </span>
                    <span className="text-muted-foreground/70 font-mono text-[11px]">{hover.id}</span>
                    <span className="truncate text-[13px]">{hover.title}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/60 font-mono text-[11px]">
                    Pasa el cursor sobre una estrella para leer su ficha · clic para abrir el hallazgo completo
                  </span>
                )}
              </div>
            )}
          </div>
        </Reveal>

        {/* Magnitude cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRIORITIES.map((p, i) => {
            const meta = priorityMeta[p]
            const allFindings = scanResult
              ? [...scanResult.findings, ...scanResult.compactFindings]
              : []
            const scanCounts: Record<Priority, number> = {
              P0: allFindings.filter(f => f.priority === 'P0').length,
              P1: allFindings.filter(f => f.priority === 'P1').length,
              P2: allFindings.filter(f => f.priority === 'P2').length,
              P3: allFindings.filter(f => f.priority === 'P3').length,
            }
            const count = scanResult ? scanCounts[p] : 0
            const max = Math.max(1, ...PRIORITIES.map((x) => scanCounts[x]))
            return (
              <Reveal key={p} delay={i * 90}>
                <TiltCard
                  as="button"
                  onClick={() => onFilter(p)}
                  glow={meta.glow}
                  ariaLabel={`Filtrar hallazgos de prioridad ${p}`}
                  className="glass h-full w-full rounded-3xl p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[11px] font-bold tracking-[0.16em]" style={{ color: meta.color }}>
                        {p} · {meta.tag}
                      </div>
                      <div className="text-muted-foreground mt-1 text-[13px]">{meta.timeline}</div>
                    </div>
                    <div
                      className="relative grid size-9 shrink-0 place-items-center rounded-full"
                      style={{ background: meta.soft }}
                    >
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full"
                        style={{ border: `1px solid ${meta.color}`, animation: 'pulse-ring 3s ease-out infinite' }}
                      />
                      <span
                        className="size-2 rounded-full"
                        style={{ background: meta.color, boxShadow: `0 0 12px 2px ${meta.glow}` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-end gap-3">
                    <span className="font-mono text-4xl leading-none font-bold tabular-nums">{count}</span>
                    <span className="text-muted-foreground/70 pb-1 text-[11px]">hallazgos</span>
                  </div>

                  <div className="bg-border/60 mt-4 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-[width] duration-1000"
                      style={{
                        width: `${(count / max) * 100}%`,
                        background: meta.color,
                        boxShadow: `0 0 14px 1px ${meta.glow}`,
                      }}
                    />
                  </div>
                  <div className="text-muted-foreground/60 mt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
                    {meta.magnitude}
                  </div>
                </TiltCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
