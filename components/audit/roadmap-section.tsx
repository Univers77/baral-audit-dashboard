'use client'

import { CosmicButton, Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { dataGaps } from '@/lib/audit-data'
import type { AuditResult } from '@/lib/scanner/types'
import { useMemo, useState } from 'react'

const PERIOD_COLORS = ['var(--pulsar)', 'var(--solar)', 'var(--star)', 'var(--nova)']

const EFFORT_PCT: Record<string, number> = { Bajo: 85, Medio: 55, Alto: 30 }

function buildRoadmap(r: AuditResult) {
  const allFindings = [...r.findings, ...r.compactFindings]
  const periods = [
    {
      key: 'ahora',
      label: 'AHORA',
      subtitle: 'Bloqueos críticos — esta semana',
      items: allFindings.filter(f => f.priority === 'P0').map(f => ({
        id: f.id,
        title: f.title,
        effort: f.effort,
        impactPct: EFFORT_PCT[f.effort] ?? 70,
      })),
    },
    {
      key: 'sprint1',
      label: 'SPRINT 1',
      subtitle: 'Alta prioridad — próximas 2 semanas',
      items: allFindings.filter(f => f.priority === 'P1').map(f => ({
        id: f.id,
        title: f.title,
        effort: f.effort,
        impactPct: EFFORT_PCT[f.effort] ?? 55,
      })),
    },
    {
      key: 'sprint2',
      label: 'SPRINT 2–3',
      subtitle: 'Mejoras planificadas',
      items: allFindings.filter(f => f.priority === 'P2').map(f => ({
        id: f.id,
        title: f.title,
        effort: f.effort,
        impactPct: EFFORT_PCT[f.effort] ?? 40,
      })),
    },
    {
      key: 'backlog',
      label: 'BACKLOG',
      subtitle: 'Espacio profundo / Q3+',
      items: allFindings.filter(f => f.priority === 'P3').map(f => ({
        id: f.id,
        title: f.title,
        effort: f.effort,
        impactPct: EFFORT_PCT[f.effort] ?? 20,
      })),
    },
  ].filter(p => p.items.length > 0)
  return periods
}

export function RoadmapSection({
  scanResult,
  onFocusFinding,
}: {
  scanResult: AuditResult | null
  onFocusFinding: (id: string) => void
}) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [openGap, setOpenGap] = useState<string | null>('g1')

  const roadmap = useMemo(() => scanResult ? buildRoadmap(scanResult) : [], [scanResult])
  const total = roadmap.reduce((n, p) => n + p.items.length, 0)
  const completed = Object.values(done).filter(Boolean).length

  return (
    <>
      <section id="roadmap" className="relative px-5 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeader
              eyebrow="Plan de vuelo"
              title={
                <>
                  Qué hacer y en <span className="text-gradient-quasar">qué orden</span>
                </>
              }
              description="Secuencia de maniobras ordenada por retorno sobre esfuerzo. Marca cada ítem para seguir el avance de la misión."
            />
          </Reveal>

          {!scanResult && (
            <Reveal delay={80}>
              <div
                className="mt-8 rounded-3xl p-12 text-center"
                style={{ border: '1px dashed var(--border)', background: 'oklch(1 0 0 / 0.02)' }}
              >
                <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/50 mb-3">
                  PLAN DE VUELO · SIN DATOS
                </p>
                <p className="text-muted-foreground text-[14px]">
                  El roadmap se genera automáticamente tras escanear una URL.
                </p>
              </div>
            </Reveal>
          )}

          {scanResult && (<>
          <Reveal delay={90}>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="glass flex flex-1 items-center gap-4 rounded-2xl px-5 py-4" style={{ border: '1px solid var(--border)' }}>
                <span className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.16em]">
                  PROGRESO DE MISIÓN
                </span>
                <span className="bg-border/70 h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    className="block h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, oklch(0.88 0.14 195), oklch(0.8 0.16 305), oklch(0.86 0.19 155))',
                      boxShadow: '0 0 16px 1px oklch(0.8 0.16 305 / 0.6)',
                    }}
                  />
                </span>
                <span className="font-mono text-[13px] tabular-nums">
                  {completed}/{total}
                </span>
              </div>
              <CosmicButton onClick={() => window.print()}>Descargar roadmap</CosmicButton>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((period, pi) => {
              const color = PERIOD_COLORS[pi]
              return (
                <Reveal key={period.key} delay={pi * 100}>
                  <TiltCard
                    intensity={5}
                    glow={`color-mix(in oklch, ${color} 35%, transparent)`}
                    className="glass h-full rounded-3xl p-5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold tracking-[0.16em]" style={{ color }}>
                        {period.label}
                      </span>
                      <span className="text-muted-foreground/50 font-mono text-[9px]">{period.items.length} maniobras</span>
                    </div>
                    <p className="text-muted-foreground/60 mt-1 text-[11px]">{period.subtitle}</p>

                    <ul className="mt-4 flex flex-col gap-2.5">
                      {period.items.map((it) => {
                        const isDone = !!done[it.id]
                        return (
                          <li
                            key={it.id}
                            className="rounded-2xl p-3 transition-colors duration-300"
                            style={{
                              background: isDone ? `color-mix(in oklch, ${color} 10%, transparent)` : 'oklch(1 0 0 / 0.03)',
                              border: '1px solid oklch(1 0 0 / 0.05)',
                            }}
                          >
                            <div className="flex items-start gap-2.5">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isDone}
                                aria-label={`Marcar ${it.title} como completado`}
                                onClick={() => setDone((s) => ({ ...s, [it.id]: !s[it.id] }))}
                                className="mt-0.5 grid size-4 shrink-0 place-items-center rounded transition-all duration-200"
                                style={{
                                  border: `1.5px solid ${isDone ? color : 'var(--muted-foreground)'}`,
                                  background: isDone ? color : 'transparent',
                                }}
                              >
                                {isDone && (
                                  <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
                                    <path
                                      d="M1.5 5.2 3.8 7.5 8.5 2.8"
                                      fill="none"
                                      stroke="oklch(0.15 0.02 280)"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                )}
                              </button>
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => onFocusFinding(it.id)}
                                  className="text-left"
                                >
                                  <span className="text-muted-foreground/60 block font-mono text-[9.5px]">{it.id}</span>
                                  <span
                                    className="mt-0.5 block text-[12.5px] leading-snug transition-colors"
                                    style={{
                                      textDecoration: isDone ? 'line-through' : 'none',
                                      opacity: isDone ? 0.55 : 1,
                                    }}
                                  >
                                    {it.title}
                                  </span>
                                </button>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="bg-secondary/70 text-muted-foreground rounded-full px-2 py-0.5 font-mono text-[9px]">
                                    {it.effort}
                                  </span>
                                  <span className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.07)' }}>
                                    <span
                                      className="block h-full rounded-full"
                                      style={{ width: `${it.impactPct}%`, background: color }}
                                    />
                                  </span>
                                  <span className="text-muted-foreground/50 font-mono text-[9px]">{it.impactPct}</span>
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </TiltCard>
                </Reveal>
              )
            })}
          </div>
          </>)}
        </div>
      </section>

      {/* Data gaps */}
      <section className="relative px-5 pb-14 sm:px-8 sm:pb-18">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionHeader
              eyebrow="Materia oscura"
              title={
                <>
                  Lo que <span className="text-gradient-cool">no pudimos medir</span>
                </>
              }
              description="Transparencia total: así sabes exactamente qué falta en este diagnóstico y qué desbloquearía cada acceso."
            />
          </Reveal>

          <div className="mt-8 flex flex-col gap-3">
            {dataGaps.map((g, i) => {
              const isOpen = openGap === g.key
              return (
                <Reveal key={g.key} delay={i * 80}>
                  <div
                    className="glass overflow-hidden rounded-2xl"
                    style={{ border: `1px solid ${isOpen ? 'oklch(0.8 0.16 305 / 0.35)' : 'var(--border)'}` }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenGap(isOpen ? null : g.key)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="size-1.5 rounded-full"
                          style={{
                            background: isOpen ? 'var(--quasar)' : 'var(--muted-foreground)',
                            boxShadow: isOpen ? '0 0 12px 2px oklch(0.8 0.16 305 / 0.7)' : 'none',
                          }}
                        />
                        <span className="text-[14px] font-semibold">{g.title}</span>
                      </span>
                      <span
                        aria-hidden
                        className="text-muted-foreground/70 font-mono text-xs transition-transform duration-300"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                      >
                        ▾
                      </span>
                    </button>
                    <div
                      className="grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="min-h-0">
                        <div className="text-muted-foreground px-5 pb-5 text-[13px] leading-relaxed">
                          <p>
                            <strong className="text-foreground">Por qué importa: </strong>
                            {g.why}
                          </p>
                          <p className="mt-2">
                            <strong className="text-foreground">Qué se necesita: </strong>
                            {g.access}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
