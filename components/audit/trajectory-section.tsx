'use client'

import { CosmicButton, Reveal, SectionHeader } from '@/components/cosmos/primitives'
import { findings, funnelStages, hypotheses, priorityMeta } from '@/lib/audit-data'
import { useState } from 'react'

export function TrajectorySection({ onFocusFinding }: { onFocusFinding: (id: string) => void }) {
  const [openStage, setOpenStage] = useState<string | null>('understand')

  const stageFindings = (key: string) => findings.filter((f) => f.stage === key)

  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Trayectoria de escape"
            title={
              <>
                El camino del usuario hacia <span className="text-gradient-cool">la acción</span>
              </>
            }
            description="Cada nodo es una etapa del funnel; el arco entre nodos muestra la fuga de gravedad — el porcentaje de usuarios que nunca alcanzan la siguiente órbita."
          />
        </Reveal>

        {/* Pipeline */}
        <Reveal delay={100}>
          <div
            className="glass mt-12 overflow-x-auto rounded-3xl p-6"
            style={{ border: '1px solid var(--border)' }}
          >
            <ol className="flex min-w-[720px] items-start">
              {funnelStages.map((s, i) => {
                const severe = s.count >= 6
                const color = severe ? 'var(--pulsar)' : s.count >= 5 ? 'var(--solar)' : 'var(--nova)'
                const glow = severe
                  ? 'oklch(0.72 0.2 15 / 0.5)'
                  : s.count >= 5
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
                        <span className="relative font-mono text-lg font-bold tabular-nums">{s.count}</span>
                      </span>
                      <span className="font-mono text-[10.5px] tracking-[0.1em]">{s.label}</span>
                    </button>

                    {s.dropoff !== null && (
                      <div className="mt-8 flex flex-1 flex-col items-center gap-1.5 px-1">
                        <span
                          className="h-[2px] w-full"
                          style={{
                            background:
                              s.dropoff > 25
                                ? 'linear-gradient(90deg, oklch(0.72 0.2 15 / 0.2), oklch(0.72 0.2 15))'
                                : 'var(--border)',
                          }}
                        />
                        <span
                          className="font-mono text-[10px]"
                          style={{ color: s.dropoff > 25 ? 'var(--pulsar)' : 'var(--muted-foreground)' }}
                        >
                          −{s.dropoff}%
                        </span>
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
                      {funnelStages.find((s) => s.key === openStage)?.count} HALLAZGOS RELACIONADOS
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
                                  background: priorityMeta[f.priority].color,
                                  boxShadow: `0 0 10px 1px ${priorityMeta[f.priority].glow}`,
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
        </Reveal>

        {/* Hypotheses */}
        <div className="mt-16">
          <Reveal>
            <div className="text-muted-foreground/60 mb-5 font-mono text-[11px] tracking-[0.18em]">
              HIPÓTESIS DE CONVERSIÓN · A CONTRASTAR CON DATOS REALES
            </div>
          </Reveal>
          <div className="flex flex-col gap-3">
            {hypotheses.map((h, i) => (
              <Reveal key={h.text} delay={i * 100}>
                <div
                  className="glass grid items-center gap-4 rounded-2xl p-4 md:grid-cols-[2fr_0.7fr_1.2fr_1fr_auto]"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <p className="text-[14px] font-medium text-pretty">{h.text}</p>
                  <span className="text-accent font-mono text-[10.5px] tracking-[0.1em]">{h.stage}</span>
                  <span className="text-muted-foreground text-[12.5px]">{h.method}</span>
                  <span className="text-muted-foreground text-[12.5px]">{h.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-border/70 h-1.5 w-16 overflow-hidden rounded-full md:w-12">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${h.confidence}%`, background: 'var(--quasar)' }}
                      />
                    </span>
                    <span className="text-primary font-mono text-[12px] tabular-nums">{h.confidence}%</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Behaviour data gap */}
        <Reveal delay={120} className="mt-16 block">
          <div
            className="relative overflow-hidden rounded-3xl p-10 text-center"
            style={{ border: '1px dashed var(--border)', background: 'oklch(1 0 0 / 0.02)' }}
          >
            <div
              aria-hidden
              className="animate-slow-spin absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.62 0.24 300 / 0.6), transparent 70%)' }}
            />
            <div className="relative">
              <span className="text-muted-foreground/70 font-mono text-3xl">◐</span>
              <h3 className="font-display mt-3 text-xl font-semibold">Telemetría de comportamiento no disponible</h3>
              <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-pretty">
                Esta sección requiere acceso a Google Analytics 4. Con datos podríamos trazar tiempo medio de sesión,
                páginas más visitadas, puntos de abandono reales y reparto por dispositivo — y dejar de estimar.
              </p>
              <div className="mt-6 flex justify-center">
                <CosmicButton>Conectar Analytics →</CosmicButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
