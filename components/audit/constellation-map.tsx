'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { priorityMeta, type Priority } from '@/lib/audit-data'
import type { AuditResult } from '@/lib/scanner/types'
import { useMemo, useState } from 'react'

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3']

/* ── Mapping functions ─────────────────────────────────────── */

const EFFORT_X: Record<string, number> = { Bajo: 0.18, Medio: 0.50, Alto: 0.82 }
const PRIORITY_Y: Record<Priority, number> = { P0: 0.14, P1: 0.34, P2: 0.66, P3: 0.84 }

function jitter(seed: string, spread: number) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973
  return ((h % 1000) / 1000 - 0.5) * spread
}

/* ── Quadrant config ───────────────────────────────────────── */

const QUADRANTS = [
  {
    id: 'q1',
    x: 0, y: 0, w: 0.5, h: 0.5,
    label: 'GANA RÁPIDO',
    sub: 'Hazlo esta semana',
    icon: '🚀',
    bg: 'oklch(0.86 0.19 155 / 0.06)',
    border: 'oklch(0.86 0.19 155 / 0.2)',
    accent: 'var(--nova)',
    desc: 'Alto impacto · Poco esfuerzo — prioridad máxima, resultado rápido',
  },
  {
    id: 'q2',
    x: 0.5, y: 0, w: 0.5, h: 0.5,
    label: 'PLANIFICA',
    sub: 'Agenda y ejecuta',
    icon: '📋',
    bg: 'oklch(0.85 0.13 88 / 0.06)',
    border: 'oklch(0.85 0.13 88 / 0.2)',
    accent: 'var(--solar)',
    desc: 'Alto impacto · Mucho esfuerzo — vale la inversión, necesita plan',
  },
  {
    id: 'q3',
    x: 0, y: 0.5, w: 0.5, h: 0.5,
    label: 'RELLENA EL SPRINT',
    sub: 'Cuando haya tiempo',
    icon: '⚡',
    bg: 'oklch(0.88 0.14 195 / 0.04)',
    border: 'oklch(0.88 0.14 195 / 0.15)',
    accent: 'var(--star)',
    desc: 'Bajo impacto · Poco esfuerzo — fácil de hacer, no es urgente',
  },
  {
    id: 'q4',
    x: 0.5, y: 0.5, w: 0.5, h: 0.5,
    label: 'EVITA / DELEGA',
    sub: 'No vale el esfuerzo ahora',
    icon: '🗑',
    bg: 'oklch(0.72 0.2 15 / 0.04)',
    border: 'oklch(0.72 0.2 15 / 0.12)',
    accent: 'var(--pulsar)',
    desc: 'Bajo impacto · Mucho esfuerzo — deja para cuando escales',
  },
]

/* ── Types ─────────────────────────────────────────────────── */

type Node = {
  id: string
  title: string
  priority: Priority
  effort: string
  xPct: number   // 0..1
  yPct: number   // 0..1
  r: number
  impactBusiness?: string
}

/* ── Chart dimensions ──────────────────────────────────────── */

const CW = 900
const CH = 560
const PAD = 56

function toSvgX(xPct: number) { return PAD + xPct * (CW - PAD * 2) }
function toSvgY(yPct: number) { return PAD + yPct * (CH - PAD * 2) }
const MID_X = toSvgX(0.5)
const MID_Y = toSvgY(0.5)

/* ── Component ─────────────────────────────────────────────── */

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

    const detailed: Node[] = scanResult.findings.map((f) => ({
      id: f.id,
      title: f.title,
      priority: f.priority as Priority,
      effort: f.effort,
      xPct: (EFFORT_X[f.effort] ?? 0.5) + jitter(f.id, 0.07),
      yPct: (PRIORITY_Y[f.priority as Priority] ?? 0.5) + jitter(f.id + 'y', 0.06),
      r: f.priority === 'P0' ? 10 : f.priority === 'P1' ? 8 : 6,
      impactBusiness: f.impactBusiness,
    }))

    const compact: Node[] = scanResult.compactFindings.map((f) => ({
      id: f.id,
      title: f.title,
      priority: f.priority as Priority,
      effort: f.effort,
      xPct: (EFFORT_X[f.effort] ?? 0.5) + jitter(f.id, 0.09),
      yPct: (PRIORITY_Y[f.priority as Priority] ?? 0.5) + jitter(f.id + 'y', 0.08),
      r: f.priority === 'P2' ? 5 : 4,
    }))

    return [...detailed, ...compact]
  }, [scanResult])

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
            eyebrow="Matriz Impacto × Esfuerzo"
            title={
              <>
                Qué resolver primero y <span className="text-gradient-cool">por qué</span>
              </>
            }
            description="Cada punto es un problema detectado en tu sitio. La posición responde dos preguntas: ¿cuánto impacto tiene en tu negocio? y ¿cuánto esfuerzo requiere resolverlo? Los del cuadrante superior izquierdo son los que deberías atacar esta semana."
            align="center"
          />
        </Reveal>

        {/* Quadrant legend strip */}
        <Reveal delay={50}>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 mx-auto max-w-4xl">
            {QUADRANTS.map((q) => (
              <div key={q.id} className="glass rounded-2xl p-3 flex flex-col gap-1.5"
                style={{ border: `1px solid ${q.border}`, background: q.bg }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{q.icon}</span>
                  <span className="font-mono text-[9px] font-bold tracking-[0.12em]" style={{ color: q.accent }}>
                    {q.label}
                  </span>
                </div>
                <p className="text-foreground/80 text-[11px] font-medium leading-snug">{q.sub}</p>
                <p className="text-muted-foreground/55 text-[10px] leading-snug">{q.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Matrix chart */}
        <Reveal delay={100}>
          <div className="glass relative mt-5 overflow-hidden rounded-3xl" style={{ border: '1px solid var(--border)' }}>
            {!scanResult ? (
              <div className="flex flex-col items-center justify-center gap-3 py-28 text-center">
                <span className="font-mono text-4xl opacity-20">⊕</span>
                <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/40">MATRIZ · SIN DATOS</p>
                <p className="text-muted-foreground/50 text-[13px]">Escanea una URL para ver la matriz de prioridades.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${CW} ${CH}`} className="min-w-[580px] w-full" role="img"
                  aria-label="Matriz Impacto vs Esfuerzo de hallazgos">

                  {/* Quadrant backgrounds */}
                  {QUADRANTS.map((q) => (
                    <rect key={q.id}
                      x={q.x === 0 ? PAD : MID_X}
                      y={q.y === 0 ? PAD : MID_Y}
                      width={(CW - PAD * 2) * 0.5}
                      height={(CH - PAD * 2) * 0.5}
                      fill={q.bg}
                      rx="4"
                    />
                  ))}

                  {/* Quadrant corner labels */}
                  {[
                    { label: '🚀 GANA RÁPIDO', x: PAD + 12, y: PAD + 20, anchor: 'start', color: 'oklch(0.86 0.19 155 / 0.9)' },
                    { label: 'PLANIFICA 📋', x: CW - PAD - 12, y: PAD + 20, anchor: 'end', color: 'oklch(0.85 0.13 88 / 0.9)' },
                    { label: '⚡ RELLENA SPRINT', x: PAD + 12, y: CH - PAD - 10, anchor: 'start', color: 'oklch(0.88 0.14 195 / 0.75)' },
                    { label: 'EVITA 🗑', x: CW - PAD - 12, y: CH - PAD - 10, anchor: 'end', color: 'oklch(0.72 0.2 15 / 0.6)' },
                  ].map((l, i) => (
                    <text key={i} x={l.x} y={l.y} fill={l.color} fontSize="10.5"
                      fontFamily="var(--font-mono)" fontWeight="700" textAnchor={l.anchor as any} letterSpacing="0.5">
                      {l.label}
                    </text>
                  ))}

                  {/* Center dividers */}
                  <line x1={MID_X} y1={PAD} x2={MID_X} y2={CH - PAD}
                    stroke="var(--border)" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.6" />
                  <line x1={PAD} y1={MID_Y} x2={CW - PAD} y2={MID_Y}
                    stroke="var(--border)" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.6" />

                  {/* X axis label */}
                  <text x={PAD + 4} y={CH - 10} fill="var(--muted-foreground)" fontSize="10"
                    fontFamily="var(--font-mono)" opacity="0.5">ESFUERZO BAJO</text>
                  <text x={CW - PAD - 4} y={CH - 10} fill="var(--muted-foreground)" fontSize="10"
                    fontFamily="var(--font-mono)" textAnchor="end" opacity="0.5">ESFUERZO ALTO →</text>

                  {/* Y axis label */}
                  <text x={12} y={PAD + 6} fill="var(--muted-foreground)" fontSize="10"
                    fontFamily="var(--font-mono)" opacity="0.5">↑ IMPACTO</text>
                  <text x={12} y={CH - PAD - 6} fill="var(--muted-foreground)" fontSize="10"
                    fontFamily="var(--font-mono)" opacity="0.5">BAJO</text>

                  {/* X-axis tick marks: Bajo / Medio / Alto */}
                  {[
                    { label: 'Bajo', xPct: 0.18 },
                    { label: 'Medio', xPct: 0.5 },
                    { label: 'Alto', xPct: 0.82 },
                  ].map(({ label, xPct }) => {
                    const sx = toSvgX(xPct)
                    return (
                      <g key={label}>
                        <line x1={sx} y1={CH - PAD} x2={sx} y2={CH - PAD + 5} stroke="var(--border)" strokeWidth="1" opacity="0.5" />
                        <text x={sx} y={CH - PAD + 17} fill="var(--muted-foreground)" fontSize="9.5"
                          fontFamily="var(--font-mono)" textAnchor="middle" opacity="0.45">{label}</text>
                      </g>
                    )
                  })}

                  {/* Y-axis tick marks: impacto labels */}
                  {[
                    { label: 'Crítico', yPct: 0.14, color: 'var(--pulsar)' },
                    { label: 'Alto', yPct: 0.34, color: 'var(--solar)' },
                    { label: 'Medio', yPct: 0.66, color: 'var(--star)' },
                    { label: 'Bajo', yPct: 0.84, color: 'var(--nova)' },
                  ].map(({ label, yPct, color }) => {
                    const sy = toSvgY(yPct)
                    return (
                      <g key={label}>
                        <line x1={PAD - 5} y1={sy} x2={PAD} y2={sy} stroke={color} strokeWidth="1" opacity="0.5" />
                        <text x={PAD - 8} y={sy + 4} fill={color} fontSize="9" fontFamily="var(--font-mono)"
                          textAnchor="end" opacity="0.7">{label}</text>
                      </g>
                    )
                  })}

                  {/* Nodes */}
                  {nodes.map((n) => {
                    const meta = priorityMeta[n.priority]
                    const sx = toSvgX(Math.max(0.03, Math.min(0.97, n.xPct)))
                    const sy = toSvgY(Math.max(0.03, Math.min(0.97, n.yPct)))
                    const isHover = hover?.id === n.id

                    // Tooltip positioning — stay inside SVG
                    const tipW = 210
                    const tipH = n.impactBusiness ? 68 : 48
                    const tipX = sx + tipW + 20 > CW - PAD ? sx - tipW - 14 : sx + 14
                    const tipY = sy - 10

                    return (
                      <g key={n.id}
                        role="button" tabIndex={0}
                        aria-label={`${n.priority} · ${n.title}`}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(n)}
                        onBlur={() => setHover(null)}
                        onClick={() => onFocusFinding(n.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFocusFinding(n.id) } }}
                        className="cursor-pointer focus:outline-none"
                      >
                        {/* Outer glow */}
                        <circle cx={sx} cy={sy} r={n.r * 3.8} fill={meta.color}
                          opacity={isHover ? 0.2 : 0.07}
                          style={{ transition: 'opacity 0.25s' }} />
                        {/* Bubble */}
                        <circle cx={sx} cy={sy} r={isHover ? n.r * 1.65 : n.r} fill={meta.color}
                          style={{
                            transition: 'r 0.2s cubic-bezier(0.16,1,0.3,1)',
                            filter: `drop-shadow(0 0 ${isHover ? 18 : 7}px ${meta.glow})`
                          }} />

                        {/* Floating tooltip */}
                        {isHover && (
                          <g>
                            <rect x={tipX} y={tipY} width={tipW} height={tipH}
                              rx={8} fill="oklch(0.16 0.03 278)" stroke={meta.color} strokeWidth="1" opacity="0.97" />
                            <text x={tipX + 10} y={tipY + 16} fill={meta.color}
                              fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">
                              {n.priority} · {n.id} · Esfuerzo {n.effort}
                            </text>
                            <foreignObject x={tipX + 8} y={tipY + 22} width={tipW - 16} height={tipH - 26}>
                              <div xmlns="http://www.w3.org/1999/xhtml"
                                style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4',
                                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {n.title}
                              </div>
                            </foreignObject>
                            {n.impactBusiness && (
                              <foreignObject x={tipX + 8} y={tipY + 44} width={tipW - 16} height={22}>
                                <div xmlns="http://www.w3.org/1999/xhtml"
                                  style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.3',
                                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                                  {n.impactBusiness}
                                </div>
                              </foreignObject>
                            )}
                          </g>
                        )}
                        <title>{`${n.id} · ${n.title}`}</title>
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            {/* Bottom bar */}
            <div className="border-t border-border/60 px-5 py-3 flex items-center gap-3 min-h-[3rem]">
              {hover ? (
                <div className="flex items-center gap-3 w-full">
                  <span className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold"
                    style={{ background: priorityMeta[hover.priority].soft, color: priorityMeta[hover.priority].color }}>
                    {hover.priority}
                  </span>
                  <span className="text-muted-foreground/55 font-mono text-[10.5px] shrink-0">{hover.id}</span>
                  <span className="flex-1 text-[12.5px] truncate">{hover.title}</span>
                  <span className="shrink-0 font-mono text-[11px]" style={{ color: 'var(--star)' }}>
                    Clic para ver solución →
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground/45 font-mono text-[11px]">
                  {scanResult
                    ? `${nodes.length} hallazgos mapeados — pasa el cursor para leer el problema · clic para ver la solución`
                    : 'Escanea una URL para ver la matriz'}
                </span>
              )}
            </div>
          </div>
        </Reveal>

        {/* Priority summary cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRIORITIES.map((p, i) => {
            const meta = priorityMeta[p]
            const count = counts[p]
            const topFinding = scanResult
              ? (scanResult.findings.find(f => f.priority === p) ?? scanResult.compactFindings.find(f => f.priority === p))
              : null

            const CARD_META: Record<Priority, { cta: string; empty: string; urgency: string }> = {
              P0: { cta: 'Actúa esta semana — cuestan clientes ahora', empty: '¡Bien! Sin problemas críticos activos.', urgency: 'URGENTE' },
              P1: { cta: 'Esta semana o la próxima — alto impacto', empty: '¡Bien! Sin oportunidades grandes sin atender.', urgency: 'IMPORTANTE' },
              P2: { cta: 'Próximo sprint — fácil de resolver', empty: 'Sin mejoras de complejidad media pendientes.', urgency: 'PLANIFICADO' },
              P3: { cta: 'Registra y retoma cuando crezcas', empty: 'Sin items en el backlog por ahora.', urgency: 'BACKLOG' },
            }
            const cm = CARD_META[p]

            return (
              <Reveal key={p} delay={i * 80}>
                <TiltCard
                  as="button"
                  onClick={() => count > 0 ? onFilter(p) : undefined}
                  glow={meta.glow}
                  ariaLabel={`Ver hallazgos ${p}`}
                  className={`glass h-full w-full rounded-3xl p-5 text-left ${count === 0 ? 'opacity-55' : ''}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded-full px-2 py-0.5 font-mono text-[8.5px] font-bold tracking-[0.14em] mb-1.5"
                        style={{ background: meta.soft, color: meta.color }}>
                        {cm.urgency}
                      </span>
                      <div className="font-mono text-[10.5px] font-bold tracking-[0.12em]" style={{ color: meta.color }}>
                        {p} · {meta.tag}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-[11.5px]">{meta.timeline}</div>
                    </div>
                    <div className="relative grid size-9 shrink-0 place-items-center rounded-full" style={{ background: meta.soft }}>
                      {count > 0 && (
                        <span aria-hidden className="absolute inset-0 rounded-full"
                          style={{ border: `1px solid ${meta.color}`, animation: 'pulse-ring 3s ease-out infinite' }} />
                      )}
                      <span className="size-2 rounded-full"
                        style={{ background: meta.color, boxShadow: count > 0 ? `0 0 12px 2px ${meta.glow}` : 'none' }} />
                    </div>
                  </div>

                  {/* Count */}
                  <div className="mt-5 flex items-end gap-2">
                    <span className="font-mono text-4xl leading-none font-bold tabular-nums">{count}</span>
                    <span className="text-muted-foreground/60 pb-1 text-[11px]">
                      {count === 1 ? 'hallazgo' : 'hallazgos'}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="bg-border/50 mt-3.5 h-1.5 overflow-hidden rounded-full">
                    <div className="h-full rounded-full transition-[width] duration-1000"
                      style={{ width: `${(count / maxCount) * 100}%`, background: meta.color, boxShadow: `0 0 12px 1px ${meta.glow}` }} />
                  </div>

                  {/* Body */}
                  <div className="mt-4 border-t border-border/40 pt-3">
                    {count === 0 ? (
                      <p className="text-[11.5px] leading-snug" style={{ color: 'var(--nova)' }}>
                        ✓ {cm.empty}
                      </p>
                    ) : (
                      <>
                        <p className="text-[11.5px] leading-snug text-foreground/65">{cm.cta}</p>
                        {topFinding && (
                          <p className="mt-2 font-mono text-[10px] text-muted-foreground/45 truncate leading-snug">
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
      </div>
    </section>
  )
}
