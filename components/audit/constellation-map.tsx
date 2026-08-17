'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { funnelStages, priorityMeta, type Priority } from '@/lib/audit-data'
import type { AuditResult } from '@/lib/scanner/types'
import { useMemo, useRef, useState } from 'react'

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3']

const BAND_META: Record<Priority, { label: string; action: string; empty: string; color: string }> = {
  P0: {
    label: 'CRÍTICO — Actúa esta semana',
    action: 'Cada día sin resolverlo cuesta clientes reales',
    empty: '¡Sin problemas críticos! Tu sitio no tiene fugas de clientes activas.',
    color: 'oklch(0.72 0.2 15 / 0.06)',
  },
  P1: {
    label: 'IMPORTANTE — Esta semana o la próxima',
    action: 'Oportunidades que se escapan a diario — alto impacto en conversión',
    empty: '¡Bien! No hay oportunidades grandes sin aprovechar en este nivel.',
    color: 'oklch(0.85 0.13 88 / 0.05)',
  },
  P2: {
    label: 'MEJORA — Próximo sprint',
    action: 'Fáciles de resolver, mejoran experiencia y posicionamiento',
    empty: 'Sin mejoras pendientes de complejidad media. Todo en orden.',
    color: 'oklch(0.88 0.14 195 / 0.04)',
  },
  P3: {
    label: 'FUTURO — Backlog',
    action: 'Vale registrar ahora para trabajarlo cuando escales',
    empty: 'Sin items en el backlog por ahora.',
    color: 'oklch(0.86 0.19 155 / 0.04)',
  },
}

function jitter(seed: string, spread: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973
  return ((h % 1000) / 1000 - 0.5) * spread
}

type Node = { id: string; title: string; priority: Priority; x: number; y: number; r: number; stage: string }

const W = 1000
const H = 440
const PADDING_L = 80
const PADDING_R = 40
const PADDING_T = 50
const BAND_H = (H - PADDING_T - 40) / 4

function bandY(p: Priority): number {
  const idx = PRIORITIES.indexOf(p)
  return PADDING_T + idx * BAND_H + BAND_H * 0.5
}

function stageX(idx: number): number {
  return PADDING_L + (idx * (W - PADDING_L - PADDING_R)) / (funnelStages.length - 1)
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
  const svgRef = useRef<SVGSVGElement>(null)

  const nodes = useMemo<Node[]>(() => {
    if (!scanResult) return []
    const detailed: Node[] = scanResult.findings.map((f) => {
      const si = Math.max(0, funnelStages.findIndex((s) => s.key === f.stage))
      const p = f.priority as Priority
      return {
        id: f.id, title: f.title, priority: p, stage: funnelStages[si]?.label ?? f.stage,
        x: stageX(si) + jitter(f.id, 52),
        y: bandY(p) + jitter(f.id + 'y', 28),
        r: p === 'P0' ? 9 : 7,
      }
    })
    const minor: Node[] = scanResult.compactFindings.map((f, i) => {
      const si = i % funnelStages.length
      const p = f.priority as Priority
      return {
        id: f.id, title: f.title, priority: p, stage: funnelStages[si]?.label ?? String(i),
        x: stageX(si) + jitter(f.id, 88),
        y: bandY(p) + jitter(f.id + 'y', 44),
        r: p === 'P2' ? 5 : 3.5,
      }
    })
    return [...detailed, ...minor]
  }, [scanResult])

  const links = useMemo(() => {
    const out: { a: Node; b: Node; priority: Priority }[] = []
    for (const p of PRIORITIES) {
      const band = nodes.filter((n) => n.priority === p).sort((a, b) => a.x - b.x)
      for (let i = 0; i < band.length - 1; i++) out.push({ a: band[i], b: band[i + 1], priority: p })
    }
    return out
  }, [nodes])

  const allFindings = scanResult ? [...scanResult.findings, ...scanResult.compactFindings] : []
  const counts: Record<Priority, number> = {
    P0: allFindings.filter(f => f.priority === 'P0').length,
    P1: allFindings.filter(f => f.priority === 'P1').length,
    P2: allFindings.filter(f => f.priority === 'P2').length,
    P3: allFindings.filter(f => f.priority === 'P3').length,
  }
  const maxCount = Math.max(1, ...PRIORITIES.map(p => counts[p]))

  return (
    <section id="diagnostico" className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Mapa de prioridades"
            title={
              <>
                Qué está fallando y <span className="text-gradient-cool">cuánto te cuesta</span>
              </>
            }
            description="Cada punto es un problema real detectado en tu sitio web. El eje vertical indica qué tan urgente es (arriba = dinero perdido ahora mismo). El eje horizontal muestra en qué parte del recorrido del cliente ocurre (izquierda = antes de que te encuentren; derecha = cuando ya quieren contratar). Haz clic en cualquier punto para ver el detalle completo."
            align="center"
          />
        </Reveal>

        {/* How-to-read strip */}
        <Reveal delay={50}>
          <div className="mt-6 mx-auto max-w-4xl rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2"
            style={{ background: 'oklch(1 0 0 / 0.025)', border: '1px solid var(--border)' }}>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/50 shrink-0">Cómo leer el gráfico</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <span className="font-bold" style={{ color: 'var(--pulsar)' }}>↑ Arriba</span>
              = más urgente
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <span className="font-bold" style={{ color: 'var(--star)' }}>→ Derecha</span>
              = más cerca del cierre
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <span className="font-bold text-foreground/80">Tamaño</span>
              = magnitud del impacto
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <span className="font-bold text-foreground/80">Clic</span>
              = ver detalle y solución
            </span>
          </div>
        </Reveal>

        {/* Star chart */}
        <Reveal delay={100}>
          <div className="glass relative mt-5 overflow-hidden rounded-3xl" style={{ border: '1px solid var(--border)' }}>
            {!scanResult ? (
              <div className="flex items-center justify-center py-24 text-center">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/40 mb-3">MAPA · SIN DATOS</p>
                  <p className="text-muted-foreground/60 text-[13px]">Escanea una URL para ver el mapa de prioridades.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  className="min-w-[640px] w-full"
                  role="img"
                  aria-label="Mapa de hallazgos por urgencia y etapa del funnel"
                >
                  {/* Priority band backgrounds */}
                  {PRIORITIES.map((p, idx) => {
                    const y = PADDING_T + idx * BAND_H
                    return (
                      <rect
                        key={p}
                        x={0} y={y} width={W} height={BAND_H}
                        fill={BAND_META[p].color}
                      />
                    )
                  })}

                  {/* Y-axis urgency arrow */}
                  <text x="10" y={PADDING_T - 14} fill="var(--muted-foreground)" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing="1" opacity="0.5">
                    URGENCIA
                  </text>
                  <line x1="20" y1={PADDING_T - 10} x2="20" y2={H - 44} stroke="var(--border)" strokeWidth="1" opacity="0.4" />
                  <polygon points={`17,${PADDING_T - 10} 23,${PADDING_T - 10} 20,${PADDING_T - 18}`} fill="var(--muted-foreground)" opacity="0.4" />

                  {/* X-axis funnel arrow label */}
                  <text x={W - 90} y={H - 8} fill="var(--muted-foreground)" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing="1" opacity="0.5">
                    FUNNEL →
                  </text>

                  {/* Band labels (Y axis) */}
                  {PRIORITIES.map((p, idx) => {
                    const cy = PADDING_T + idx * BAND_H + BAND_H * 0.5
                    const meta = priorityMeta[p]
                    return (
                      <g key={p}>
                        {/* Dashed separator */}
                        <line x1={PADDING_L - 8} x2={W - PADDING_R} y1={PADDING_T + idx * BAND_H} y2={PADDING_T + idx * BAND_H}
                          stroke={meta.color} strokeDasharray="2 10" strokeWidth="1" opacity="0.25" />
                        {/* Priority badge */}
                        <text x={42} y={cy + 4} fill={meta.color} fontSize="11.5" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">
                          {p}
                        </text>
                        {/* Count bubble */}
                        {counts[p] > 0 && (
                          <g>
                            <circle cx={42} cy={cy + 18} r="10" fill={meta.color} opacity="0.15" />
                            <text x={42} y={cy + 22} fill={meta.color} fontSize="10" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">
                              {counts[p]}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}

                  {/* Stage vertical guides */}
                  {funnelStages.map((s, i) => {
                    const x = stageX(i)
                    return (
                      <g key={s.key}>
                        <line x1={x} x2={x} y1={PADDING_T} y2={H - 34}
                          stroke="var(--border)" strokeWidth="1" opacity={i === 0 || i === funnelStages.length - 1 ? 0.5 : 0.25} />
                        <text x={x} y={H - 18} fill="var(--muted-foreground)" fontSize="10"
                          fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="1" opacity="0.65">
                          {s.label}
                        </text>
                      </g>
                    )
                  })}

                  {/* Constellation lines */}
                  {links.map((l, i) => (
                    <line key={`${l.a.id}-${l.b.id}-${i}`}
                      x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y}
                      stroke={priorityMeta[l.priority].color} strokeWidth="1"
                      opacity={hover ? (hover.priority === l.priority ? 0.55 : 0.08) : 0.22}
                      strokeDasharray="3 6"
                      style={{ transition: 'opacity 0.3s ease' }}
                    />
                  ))}

                  {/* Stars */}
                  {nodes.map((n) => {
                    const meta = priorityMeta[n.priority]
                    const isHover = hover?.id === n.id
                    return (
                      <g
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${n.priority} · ${n.title}`}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(n)}
                        onBlur={() => setHover(null)}
                        onClick={() => onFocusFinding(n.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocusFinding(n.id) } }}
                        className="cursor-pointer focus:outline-none"
                        style={{ transition: 'all 0.25s' }}
                      >
                        {/* Outer glow halo */}
                        <circle cx={n.x} cy={n.y} r={n.r * 4} fill={meta.color} opacity={isHover ? 0.18 : 0.07} style={{ transition: 'opacity 0.3s' }} />
                        {/* Star */}
                        <circle cx={n.x} cy={n.y} r={isHover ? n.r * 1.6 : n.r} fill={meta.color}
                          style={{ transition: 'r 0.22s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 ${isHover ? 16 : 6}px ${meta.glow})` }} />
                        {/* Floating tooltip near the star */}
                        {isHover && (
                          <g>
                            <rect
                              x={n.x < W * 0.7 ? n.x + 16 : n.x - 220}
                              y={n.y < H * 0.5 ? n.y + 8 : n.y - 60}
                              width={200} height={50}
                              rx={8} ry={8}
                              fill="oklch(0.18 0.032 278)"
                              stroke={meta.color}
                              strokeWidth="1"
                              opacity="0.97"
                            />
                            <text
                              x={n.x < W * 0.7 ? n.x + 24 : n.x - 212}
                              y={n.y < H * 0.5 ? n.y + 24 : n.y - 44}
                              fill={meta.color} fontSize="9.5" fontFamily="var(--font-mono)" fontWeight="700"
                            >
                              {n.priority} · {n.id}
                            </text>
                            <foreignObject
                              x={n.x < W * 0.7 ? n.x + 16 : n.x - 220}
                              y={n.y < H * 0.5 ? n.y + 28 : n.y - 34}
                              width={200} height={36}
                            >
                              <div xmlns="http://www.w3.org/1999/xhtml"
                                style={{ padding: '0 8px', fontSize: '10px', color: 'var(--foreground)', lineHeight: '1.35', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {n.title}
                              </div>
                            </foreignObject>
                          </g>
                        )}
                        <title>{`${n.id} · ${n.title}`}</title>
                      </g>
                    )
                  })}

                  {/* Legend top-right */}
                  <g transform={`translate(${W - 190}, ${PADDING_T + 8})`}>
                    <rect x="0" y="0" width="180" height="78" rx="8" fill="oklch(0.13 0.022 275 / 0.85)" stroke="var(--border)" strokeWidth="1" />
                    <text x="10" y="16" fill="var(--muted-foreground)" fontSize="8.5" fontFamily="var(--font-mono)" letterSpacing="1" opacity="0.6">REFERENCIAS DE COLOR</text>
                    {PRIORITIES.map((p, i) => {
                      const meta = priorityMeta[p]
                      return (
                        <g key={p} transform={`translate(10, ${26 + i * 13})`}>
                          <circle cx="5" cy="4" r="4.5" fill={meta.color} opacity="0.9" />
                          <text x="16" y="8" fill="var(--muted-foreground)" fontSize="9.5" fontFamily="var(--font-mono)">{p} — {BAND_META[p].label.split('—')[0].trim()}</text>
                        </g>
                      )
                    })}
                  </g>
                </svg>
              </div>
            )}

            {/* Bottom status bar */}
            <div className="border-t border-border/60 px-5 py-3 flex items-center gap-3 min-h-[3.25rem]">
              {hover ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold"
                    style={{ background: priorityMeta[hover.priority].soft, color: priorityMeta[hover.priority].color }}>
                    {hover.priority}
                  </span>
                  <span className="text-muted-foreground/60 font-mono text-[11px] shrink-0">{hover.id}</span>
                  <span className="flex-1 text-[13px] truncate">{hover.title}</span>
                  <span className="shrink-0 text-[11px]" style={{ color: 'var(--star)' }}>Clic para ver solución →</span>
                </div>
              ) : (
                <span className="text-muted-foreground/50 font-mono text-[11px]">
                  {scanResult
                    ? `${nodes.length} hallazgos mapeados — pasa el cursor para leer el problema · clic para ver la solución`
                    : 'Escanea una URL para ver el mapa'}
                </span>
              )}
            </div>
          </div>
        </Reveal>

        {/* Priority cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRIORITIES.map((p, i) => {
            const meta = priorityMeta[p]
            const biz = BAND_META[p]
            const count = counts[p]
            const topFinding = scanResult
              ? (scanResult.findings.find(f => f.priority === p) ?? scanResult.compactFindings.find(f => f.priority === p))
              : null

            return (
              <Reveal key={p} delay={i * 80}>
                <TiltCard
                  as="button"
                  onClick={() => count > 0 ? onFilter(p) : undefined}
                  glow={meta.glow}
                  ariaLabel={`Filtrar hallazgos de prioridad ${p}`}
                  className={`glass h-full w-full rounded-3xl p-5 text-left ${count === 0 ? 'opacity-60' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] font-bold tracking-[0.16em]" style={{ color: meta.color }}>
                        {p} · {meta.tag}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-[12px]">{meta.timeline}</div>
                    </div>
                    <div className="relative grid size-9 shrink-0 place-items-center rounded-full" style={{ background: meta.soft }}>
                      {count > 0 && (
                        <span aria-hidden className="absolute inset-0 rounded-full"
                          style={{ border: `1px solid ${meta.color}`, animation: 'pulse-ring 3s ease-out infinite' }} />
                      )}
                      <span className="size-2 rounded-full" style={{ background: meta.color, boxShadow: count > 0 ? `0 0 12px 2px ${meta.glow}` : 'none' }} />
                    </div>
                  </div>

                  {/* Count */}
                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-mono text-4xl leading-none font-bold tabular-nums">{count}</span>
                    <span className="text-muted-foreground/60 pb-1 text-[11px]">hallazgos</span>
                  </div>

                  {/* Progress bar */}
                  <div className="bg-border/50 mt-3.5 h-1.5 overflow-hidden rounded-full">
                    <div className="h-full rounded-full transition-[width] duration-1000"
                      style={{ width: `${(count / maxCount) * 100}%`, background: meta.color, boxShadow: `0 0 12px 1px ${meta.glow}` }} />
                  </div>

                  {/* Business impact text */}
                  <div className="mt-4 border-t border-border/40 pt-3">
                    {count === 0 ? (
                      <p className="text-[11.5px] leading-snug" style={{ color: 'var(--nova)' }}>
                        ✓ {biz.empty}
                      </p>
                    ) : (
                      <>
                        <p className="text-[11.5px] leading-snug text-foreground/70">{biz.action}</p>
                        {topFinding && (
                          <p className="mt-2 font-mono text-[10px] text-muted-foreground/50 truncate">
                            Ej: {topFinding.title}
                          </p>
                        )}
                        <p className="mt-2.5 font-mono text-[10px] font-bold" style={{ color: meta.color }}>
                          Ver {count} hallazgo{count !== 1 ? 's' : ''} →
                        </p>
                      </>
                    )}
                  </div>
                </TiltCard>
              </Reveal>
            )
          })}
        </div>

        {/* Stage glossary */}
        <Reveal delay={80}>
          <div className="mt-6 mx-auto glass rounded-2xl px-5 py-4" style={{ border: '1px solid var(--border)' }}>
            <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/45 mb-3">ETAPAS DEL RECORRIDO DEL CLIENTE — qué sucede en cada columna del mapa</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { key: 'DISCOVER', es: 'Google / redes te encuentran', icon: '🔍' },
                { key: 'ARRIVE', es: 'El visitante llega y decide quedarse', icon: '🛬' },
                { key: 'UNDERSTAND', es: 'Entiende qué ofreces y si le sirve', icon: '💡' },
                { key: 'TRUST', es: 'Decide si confiar en tu marca', icon: '🤝' },
                { key: 'ACTION', es: 'Hace clic en contactar o cotizar', icon: '👆' },
                { key: 'CONVERT', es: 'Completa el formulario o llama', icon: '✅' },
              ].map((s) => (
                <div key={s.key} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px]">{s.icon}</span>
                    <span className="font-mono text-[9px] font-bold tracking-[0.12em]" style={{ color: 'var(--star)' }}>{s.key}</span>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground/65 leading-snug">{s.es}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
