'use client'

import { references, site, totalFindings } from '@/lib/audit-data'
import { CosmicButton, Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'

export function FooterSection() {
  return (
    <>
      <section id="referencias" className="relative border-t border-border/60 py-24 md:py-32">
        <div className="mx-auto w-full max-w-6xl px-6">
          <SectionHeader
            eyebrow="Cartografía de referencia"
            title="Qué orbita alrededor tuyo"
            description="Sistemas vecinos observados durante la auditoría. Cada uno aporta algo que admirar, algo que adaptar y algo que evitar: nada se subestima."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {references.map((ref, i) => (
              <Reveal key={ref.domain} delay={i * 80}>
                <TiltCard className="h-full p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm font-medium text-foreground">{ref.domain}</p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {ref.orbit}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-xl font-semibold tabular-nums text-gradient-quasar">{ref.gravity}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        gravedad
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 flex flex-col gap-2.5 border-t border-border/60 pt-4">
                    {(
                      [
                        ['Admirar', ref.admire, 'var(--nova)'],
                        ['Adaptar', ref.adapt, 'var(--star)'],
                        ['Evitar', ref.avoid, 'var(--pulsar)'],
                      ] as const
                    ).map(([k, v, color]) => (
                      <div key={k} className="flex items-start gap-3">
                        <dt className="flex w-16 shrink-0 items-center gap-2 pt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: color }}
                            aria-hidden="true"
                          />
                          {k}
                        </dt>
                        <dd className="text-sm leading-relaxed text-foreground/85">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/60 py-24 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in oklch, var(--quasar) 45%, transparent), transparent 70%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-3xl px-6 text-center">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Fin de la observación
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-foreground md:text-5xl">
              {totalFindings} señales trazadas. Ahora toca <span className="text-gradient-quasar">mover la órbita</span>
              .
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted-foreground">
              Un mapa sin navegación no cambia nada. Prioriza la Onda 1, corrige los P0 y vuelve a medir en 30 días para
              comparar la trayectoria real contra este punto de partida.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <CosmicButton onClick={() => window.print()}>Exportar informe</CosmicButton>
              <CosmicButton
                variant="outline"
                onClick={() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver plan por ondas
              </CosmicButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Baral globe / brand closing */}
      <section className="relative border-t border-border/60 py-20 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, oklch(0.55 0.22 296 / 0.18), transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 flex flex-col items-center gap-8">
          {/* Globe SVG */}
          <div
            aria-hidden="true"
            className="animate-slow-spin"
            style={{ animationDuration: '60s' }}
          >
            <svg viewBox="0 0 160 160" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="globeGrad" cx="38%" cy="32%" r="70%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="50%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#3b0d8a" />
                </radialGradient>
                <filter id="globeGlow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Globe body */}
              <circle cx="80" cy="80" r="72" fill="url(#globeGrad)" opacity="0.95" />
              <circle cx="80" cy="80" r="72" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" />
              {/* Latitude lines */}
              <ellipse cx="80" cy="80" rx="72" ry="22" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.35" />
              <ellipse cx="80" cy="80" rx="72" ry="46" fill="none" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.25" />
              <ellipse cx="80" cy="56" rx="52" ry="16" fill="none" stroke="#c4b5fd" strokeWidth="0.7" opacity="0.2" />
              <ellipse cx="80" cy="104" rx="52" ry="16" fill="none" stroke="#c4b5fd" strokeWidth="0.7" opacity="0.2" />
              {/* Longitude lines */}
              <path d="M80 8 Q120 80 80 152 Q40 80 80 8" fill="none" stroke="#c4b5fd" strokeWidth="1" opacity="0.3" />
              <path d="M80 8 Q140 80 80 152" fill="none" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.2" />
              <path d="M80 8 Q20 80 80 152" fill="none" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.2" />
              {/* Horizontal equator */}
              <line x1="8" y1="80" x2="152" y2="80" stroke="#c4b5fd" strokeWidth="1" opacity="0.3" />
              {/* Highlight */}
              <circle cx="58" cy="52" r="18" fill="white" opacity="0.08" />
            </svg>
          </div>

          <div className="text-center flex flex-col items-center gap-3">
            <img src="/baral-logo.svg" alt="Baral Estrategia Integral Creativa" width="180" height="54" />
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
              Diagnóstico generado por Master Web Auditor v2.0
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: 'var(--quasar)', boxShadow: '0 0 10px #7C3AED' }}
              aria-hidden="true"
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {site.title} — {site.version}
            </p>
          </div>
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {site.url} · {site.pagesAnalyzed} páginas · {site.date}
          </p>
        </div>
      </footer>
    </>
  )
}
