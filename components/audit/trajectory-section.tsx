'use client'

import { Reveal, SectionHeader } from '@/components/cosmos/primitives'
import { funnelStages, priorityMeta } from '@/lib/audit-data'
import type { AuditResult } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'
import { GA4Connect } from '@/components/ga4/ga4-connect'
import { useState } from 'react'

export function TrajectorySection({
  scanResult,
  onFocusFinding,
  onGA4Data,
  ga4Data,
}: {
  scanResult: AuditResult | null
  onFocusFinding: (id: string) => void
  onGA4Data: (data: GA4Metrics) => void
  ga4Data: GA4Metrics | null
}) {
  const [openStage, setOpenStage] = useState<string | null>(null)

  const activeFindings = scanResult?.findings ?? []
  const stageFindings = (key: string) => activeFindings.filter((f) => f.stage === key)
  const stageCount = (key: string) => activeFindings.filter((f) => f.stage === key).length

  return (
    <section className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Trayectoria de escape"
            title={
              <>
                El camino del usuario hacia <span className="text-gradient-cool">la acción</span>
              </>
            }
            description="Cada nodo es una etapa del funnel con los hallazgos que la afectan. Las fugas de gravedad entre etapas requieren datos reales de GA4 para calcularse — no se estiman."
          />
        </Reveal>

        {/* Pipeline */}
        <Reveal delay={100}>
          {!scanResult ? (
            <div
              className="glass mt-12 rounded-3xl p-12 text-center"
              style={{ border: '1px dashed var(--border)' }}
            >
              <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground/50 mb-3">
                TRAYECTORIA · SIN DATOS
              </p>
              <p className="text-muted-foreground text-[14px]">
                El mapa del funnel aparece aquí tras escanear una URL.
              </p>
            </div>
          ) : (
          <div
            className="glass mt-12 overflow-x-auto rounded-3xl p-6"
            style={{ border: '1px solid var(--border)' }}
          >
            <ol className="flex min-w-[720px] items-start">
              {funnelStages.map((s, i) => {
                const count = stageCount(s.key)
                const severe = count >= 4
                const color = severe ? 'var(--pulsar)' : count >= 2 ? 'var(--solar)' : 'var(--nova)'
                const glow = severe
                  ? 'oklch(0.72 0.2 15 / 0.5)'
                  : count >= 2
                    ? 'oklch(0.85 0.13 88 / 0.4)'
                    : 'oklch(0.86 0.19 155 / 0.35)'
                const isOpen = openStage === s.key
                return (
                  <li key={s.key} className="flex flex-1 items-start">
                    <button
                      type="button"
                      onClick={() => setOpenStage(isOpen ? null : s.key)}
                      aria-expanded={isOpen}
                      className="group flex min-w-[104px] flex-col items-center gap-2.5"
                    >
                      <span className="relative grid size-16 place-items-center">
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-full transition-transform duration-500 group-hover:scale-110"
                          style={{
                            background: 'oklch(0.18 0.032 278)',
                            border: `2px solid ${color}`,
                            boxShadow: `0 0 26px -4px ${glow}${isOpen ? ', inset 0 0 22px -6px ' + glow : ''}`,
                          }}
                        />
                        {severe && (
                          <span
                            aria-hidden
                            className="absolute inset-0 rounded-full"
                            style={{ border: `1px solid ${color}`, animation: 'pulse-ring 2.6s ease-out infinite' }}
                          />
                        )}
                        <span className="relative font-mono text-lg font-bold tabular-nums">{count}</span>
                      </span>
                      <span className="font-mono text-[10.5px] tracking-[0.1em]">{s.label}</span>
                    </button>

                    {i < funnelStages.length - 1 && (
                      <div className="mt-8 flex flex-1 flex-col items-center gap-1.5 px-1">
                        <span className="h-[2px] w-full" style={{ background: 'var(--border)' }} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>

            {/* stage detail */}
            <div
              className="grid overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ gridTemplateRows: openStage ? '1fr' : '0fr' }}
            >
              <div className="min-h-0">
                {openStage && (
                  <div
                    className="mt-6 rounded-2xl p-5"
                    style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.16em]">
                      ETAPA {funnelStages.find((s) => s.key === openStage)?.label} ·{' '}
                      {stageFindings(openStage).length} HALLAZGOS RELACIONADOS
                    </div>
                    <ul className="mt-3 flex flex-col gap-2">
                      {stageFindings(openStage).length > 0 ? (
                        stageFindings(openStage).map((f) => (
                          <li key={f.id}>
                            <button
                              type="button"
                              onClick={() => onFocusFinding(f.id)}
                              className="hover:bg-foreground/[0.04] flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors"
                            >
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                  background: priorityMeta[f.priority as keyof typeof priorityMeta]?.color ?? 'var(--nova)',
                                  boxShadow: `0 0 10px 1px ${priorityMeta[f.priority as keyof typeof priorityMeta]?.glow ?? 'transparent'}`,
                                }}
                              />
                              <span className="text-muted-foreground/60 w-28 shrink-0 font-mono text-[10.5px]">
                                {f.id}
                              </span>
                              <span className="flex-1 text-[13px]">{f.title}</span>
                              <span className="text-accent shrink-0 text-[11px]">abrir →</span>
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground text-[13px]">
                          Sin hallazgos detallados en esta etapa; sólo elementos P2-P3 de menor magnitud.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </Reveal>

        {/* Las hipótesis de conversión se retiraron: eran texto fijo de la
            auditoría manual de baralintegral.com («reparar los contadores
            animados…») y se mostraban idénticas para cualquier dominio
            escaneado. Formular hipótesis reales exige datos de comportamiento,
            así que su lugar natural es el bloque de GA4 de abajo. */}

        {/* GA4 live data block */}
        <Reveal delay={120} className="mt-16 block">
          <div
            className="relative overflow-hidden rounded-3xl p-8"
            style={{
              border: ga4Data ? '1px solid oklch(0.86 0.19 155 / 0.25)' : '1px dashed var(--border)',
              background: 'oklch(1 0 0 / 0.02)',
            }}
          >
            <div
              aria-hidden
              className="animate-slow-spin absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.62 0.24 300 / 0.6), transparent 70%)' }}
            />
            <div className="relative">
              {!ga4Data && (
                <div className="text-center mb-6">
                  <span className="font-mono text-3xl text-muted-foreground/70">◐</span>
                  <h3 className="font-display mt-3 text-xl font-semibold">Telemetría de comportamiento</h3>
                  <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-pretty">
                    Conecta Google Analytics 4 para ver sesiones, dispositivos, canales y páginas reales del sitio auditado — sin estimaciones.
                  </p>
                </div>
              )}
              <GA4Connect onData={onGA4Data} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
