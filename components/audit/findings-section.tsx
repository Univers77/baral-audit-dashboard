'use client'

import { CosmicButton, Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { auditxStatusMeta, calcRisk, priorityMeta, type Priority } from '@/lib/audit-data'
import type { AuditResult, AuditFinding, AuditCompactFinding } from '@/lib/scanner/types'
import { cn } from '@/lib/utils'
import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const FILTERS: (Priority | 'ALL')[] = ['ALL', 'P0', 'P1', 'P2', 'P3']

export function FindingsSection({
  scanResult,
  filter,
  setFilter,
  focusId,
}: {
  scanResult: AuditResult | null
  filter: Priority | 'ALL'
  setFilter: (p: Priority | 'ALL') => void
  focusId: string | null
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [explain, setExplain] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!focusId) return
    setQuery('')
    setFilter('ALL')
    setOpen((s) => ({ ...s, [focusId]: true }))
    const t = window.setTimeout(() => {
      const el = document.getElementById(`finding-${focusId}`)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' })
    }, 90)
    return () => window.clearTimeout(t)
  }, [focusId, setFilter])

  const q = query.trim().toLowerCase()

  const sourceFindings: AuditFinding[] = scanResult?.findings ?? []
  const sourceCompact: AuditCompactFinding[] = scanResult?.compactFindings ?? []

  const detailed = useMemo(
    () =>
      sourceFindings.filter((f) => {
        if (filter !== 'ALL' && f.priority !== filter) return false
        if (!q) return true
        return (
          f.title.toLowerCase().includes(q) ||
          f.what.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q)
        )
      }),
    [sourceFindings, filter, q],
  )

  const compact = useMemo(
    () =>
      sourceCompact.filter((f) => {
        if (filter !== 'ALL' && f.priority !== filter) return false
        if (!q) return true
        return f.title.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)
      }),
    [sourceCompact, filter, q],
  )

  const compactP2 = compact.filter((c) => c.priority === 'P2')
  const compactP3 = compact.filter((c) => c.priority === 'P3')

  return (
    <section id="hallazgos" className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeader
            eyebrow="Registro estelar"
            title={
              <>
                Bloqueos <span className="text-gradient-quasar">críticos</span> en la trayectoria
              </>
            }
            description="Todos los hallazgos ordenados por prioridad de negocio. Cada ficha trae evidencia, confianza y dirección de solución verificable."
          />
        </Reveal>

        {/* Controls */}
        <div className="sticky top-[3.75rem] z-30 -mx-2 mt-8 px-2 py-3">
          <div
            className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="flex min-w-[200px] flex-1 items-center gap-2 px-3">
              <Search aria-hidden className="text-muted-foreground/60 size-4 shrink-0" />
              <label htmlFor="find-search" className="sr-only">
                Buscar hallazgos
              </label>
              <input
                id="find-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, ID o categoría…"
                className="placeholder:text-muted-foreground/50 w-full bg-transparent py-2 text-[13px] outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => {
                const isActive = filter === f
                const color = f === 'ALL' ? 'var(--quasar)' : priorityMeta[f].color
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={isActive}
                    className={cn(
                      'rounded-xl px-3.5 py-2 font-mono text-[12px] font-bold tracking-wide transition-all duration-300',
                      isActive ? 'scale-[1.03]' : 'text-muted-foreground hover:text-foreground',
                    )}
                    style={
                      isActive
                        ? {
                            color: 'oklch(0.15 0.02 280)',
                            background: color,
                            boxShadow: `0 6px 22px -10px ${color}`,
                          }
                        : { background: 'oklch(1 0 0 / 0.03)' }
                    }
                  >
                    {f === 'ALL' ? 'TODOS' : f}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Empty state when no scan */}
        {!scanResult && (
          <div
            className="mt-6 glass rounded-3xl p-12 text-center"
            style={{ border: '1px dashed var(--border)' }}
          >
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/50 mb-3">
              HALLAZGOS · SIN DATOS
            </p>
            <p className="text-muted-foreground text-[14px]">
              Los hallazgos aparecen aquí tras escanear una URL arriba.
            </p>
          </div>
        )}

        {/* Detailed cards */}
        <div className="mt-6 flex flex-col gap-5">
          {detailed.map((f, i) => {
            const meta = priorityMeta[f.priority]
            const isOpen = open[f.id]
            const isFocused = focusId === f.id
            return (
              <Reveal key={f.id} delay={Math.min(i * 60, 240)}>
                <TiltCard
                  intensity={3.5}
                  glow={meta.glow}
                  className={cn('glass rounded-3xl p-6 sm:p-7')}
                  ariaLabel={f.title}
                >
                  <div id={`finding-${f.id}`} className="scroll-mt-40" />
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ background: meta.color, boxShadow: `0 0 20px 2px ${meta.glow}` }}
                  />
                  {isFocused && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      style={{ border: `1px solid ${meta.color}`, boxShadow: `inset 0 0 40px -12px ${meta.glow}` }}
                    />
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-secondary/70 text-muted-foreground rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.12em]">
                        {f.category}
                      </span>
                      <span className="text-muted-foreground/60 font-mono text-[11px]">{f.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em]"
                        style={{ background: meta.soft, color: meta.color }}
                      >
                        {f.priority} · {meta.magnitude.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExplain((s) => ({ ...s, [f.id]: !s[f.id] }))}
                        aria-expanded={!!explain[f.id]}
                        className="text-muted-foreground hover:text-primary hover:border-primary/50 grid size-6 place-items-center rounded-full border text-[11px] font-bold transition-colors"
                        style={{ background: 'oklch(1 0 0 / 0.04)' }}
                        title="Explícame esto en simple"
                      >
                        ?
                      </button>
                    </div>
                  </div>

                  <h3 className="font-display mt-4 text-[19px] leading-snug font-semibold text-pretty">{f.title}</h3>

                  {explain[f.id] && (
                    <p
                      className="text-muted-foreground mt-3 rounded-2xl p-4 text-[13px] leading-relaxed"
                      style={{
                        background: 'oklch(0.8 0.16 305 / 0.07)',
                        border: '1px solid oklch(0.8 0.16 305 / 0.24)',
                      }}
                    >
                      <span className="text-primary font-semibold">En simple: </span>
                      {f.what} Esto se traduce en {f.impactBusiness.charAt(0).toLowerCase() + f.impactBusiness.slice(1)}
                    </p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Panel label="QUÉ OBSERVAMOS">
                      <p className="text-muted-foreground text-[13.5px] leading-relaxed">{f.what}</p>
                    </Panel>
                    <Panel label="IMPACTO">
                      <ul className="flex flex-col gap-2 text-[13px]">
                        <li className="text-muted-foreground">
                          <strong className="text-foreground font-semibold">Negocio: </strong>
                          {f.impactBusiness}
                        </li>
                        <li className="text-muted-foreground">
                          <strong className="text-foreground font-semibold">Usuario: </strong>
                          {f.impactUser}
                        </li>
                        <li className="text-muted-foreground">
                          <strong className="text-foreground font-semibold">Técnico: </strong>
                          {f.impactTech}
                        </li>
                      </ul>
                    </Panel>
                  </div>

                  <div className="mt-3">
                    <Panel label="EVIDENCIA">
                      <ul className="flex flex-col gap-2">
                        {f.evidence.map((ev) => (
                          <li key={ev.source} className="flex flex-wrap items-center gap-2">
                            <span className="bg-secondary/80 text-muted-foreground rounded-full px-2.5 py-0.5 font-mono text-[10px]">
                              {ev.source}
                            </span>
                            <span className="text-primary font-mono text-[12.5px]">{ev.value}</span>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  </div>

                  {/* AUDITOR-X metadata row */}
                  {(() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const statusKey = f.auditxStatus as any
                    const statusMeta = auditxStatusMeta[statusKey as keyof typeof auditxStatusMeta] ?? auditxStatusMeta['CONFIRMED']
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const risk = calcRisk(f as any)
                    return (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.1em]"
                          style={{
                            background: statusMeta.bg,
                            color: statusMeta.color,
                            border: `1px solid ${statusMeta.color}55`,
                          }}
                        >
                          {statusMeta.label}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.1em]"
                          style={{ background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                        >
                          {f.module}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.1em]"
                          title={`Risk = ${f.severity} × ${(f.confidence/100).toFixed(2)} × ${f.scope} × ${f.businessImpact}`}
                          style={{ background: 'oklch(0.8 0.16 305 / 0.08)', border: '1px solid oklch(0.8 0.16 305 / 0.3)', color: 'oklch(0.88 0.14 195)' }}
                        >
                          RISK {risk.toFixed(1)}
                        </span>
                      </div>
                    )
                  })()}

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.14em]">
                        CONFIANZA
                      </span>
                      <span className="bg-border/70 h-1.5 w-24 overflow-hidden rounded-full">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${f.confidence}%`,
                            background: 'linear-gradient(90deg, oklch(0.88 0.14 195), oklch(0.8 0.16 305))',
                          }}
                        />
                      </span>
                      <span className="font-mono text-[12px] tabular-nums">{f.confidence}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.14em]">ESFUERZO</span>
                      <span className="text-[12px] font-semibold">{f.effort}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen((s) => ({ ...s, [f.id]: !s[f.id] }))}
                      aria-expanded={!!isOpen}
                      className="text-accent hover:text-foreground ml-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors"
                    >
                      ¿Qué pasa si no lo arreglamos?
                      <ChevronDown
                        aria-hidden
                        className="size-4 transition-transform duration-300"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                      />
                    </button>
                  </div>

                  <div
                    className="grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="min-h-0">
                      <div
                        className="text-muted-foreground mt-4 rounded-2xl p-4 text-[13px] leading-relaxed"
                        style={{
                          background: 'oklch(0.72 0.2 15 / 0.07)',
                          border: '1px solid oklch(0.72 0.2 15 / 0.24)',
                        }}
                      >
                        <p>
                          <strong className="text-foreground">En 3 meses: </strong>
                          {f.impact3mo}
                        </p>
                        <p className="mt-1.5">
                          <strong className="text-foreground">En 6 meses: </strong>
                          {f.impact6mo}
                        </p>
                        <p className="text-muted-foreground/60 mt-2.5 font-mono text-[10px] italic">
                          [Estimado — sin datos históricos]
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-border/70 mt-6 border-t pt-4">
                    <div className="text-muted-foreground/60 font-mono text-[10px] tracking-[0.16em]">
                      DIRECCIÓN DE SOLUCIÓN
                    </div>
                    <p className="text-muted-foreground mt-2 text-[13.5px] leading-relaxed">{f.direction}</p>
                    <p className="text-muted-foreground/60 mt-2 text-[12px]">
                      Valida con: <span className="text-accent/90">{f.validate}</span>
                    </p>
                  </div>
                </TiltCard>
              </Reveal>
            )
          })}

          {scanResult && detailed.length === 0 && (
            <div
              className="glass rounded-3xl p-10 text-center"
              style={{ border: '1px dashed var(--border)' }}
            >
              <p className="text-muted-foreground text-sm">
                Ningún hallazgo detallado coincide con este filtro.
              </p>
              <div className="mt-4 flex justify-center">
                <CosmicButton
                  variant="outline"
                  onClick={() => {
                    setFilter('ALL')
                    setQuery('')
                  }}
                >
                  Restablecer búsqueda
                </CosmicButton>
              </div>
            </div>
          )}
        </div>

        {/* Compact lists */}
        {compactP2.length > 0 && (
          <CompactList label={`P2 · PRÓXIMO SPRINT (${compactP2.length})`} items={compactP2} focusId={focusId} />
        )}
        {compactP3.length > 0 && (
          <CompactList label={`P3 · ESPACIO PROFUNDO / Q3 (${compactP3.length})`} items={compactP3} focusId={focusId} />
        )}
      </div>
    </section>
  )
}

function Panel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid oklch(1 0 0 / 0.05)' }}
    >
      <div className="text-muted-foreground/60 mb-2.5 font-mono text-[10px] tracking-[0.16em]">{label}</div>
      {children}
    </div>
  )
}

function CompactList({
  label,
  items,
  focusId,
}: {
  label: string
  items: { id: string; title: string; effort: string; priority: Priority }[]
  focusId: string | null
}) {
  return (
    <Reveal className="mt-12">
      <div className="text-muted-foreground/60 mb-4 font-mono text-[11px] tracking-[0.18em]">{label}</div>
      <ul className="flex flex-col gap-2">
        {items.map((c) => {
          const meta = priorityMeta[c.priority]
          const focused = focusId === c.id
          return (
            <li
              key={c.id}
              id={`finding-${c.id}`}
              className="group flex scroll-mt-40 items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-300 hover:translate-x-1"
              style={{
                background: focused ? meta.soft : 'oklch(1 0 0 / 0.025)',
                border: `1px solid ${focused ? meta.color : 'var(--border)'}`,
                borderLeft: `3px solid ${meta.color}`,
              }}
            >
              <span className="text-muted-foreground/60 w-28 shrink-0 font-mono text-[11px]">{c.id}</span>
              <span className="flex-1 text-[13.5px]">{c.title}</span>
              <span className="text-muted-foreground/70 shrink-0 font-mono text-[10px]">{c.effort}</span>
            </li>
          )
        })}
      </ul>
    </Reveal>
  )
}
