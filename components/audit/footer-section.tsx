'use client'

import { references, site, totalFindings } from '@/lib/audit-data'
import { CosmicButton, Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { BaralPlanet } from '@/components/audit/baral-planet'

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

      {/* Baral planet brand closing */}
      <section className="relative border-t border-border/60 py-24 overflow-hidden">
        {/* Deep space background wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 108%, rgba(109,40,217,0.22) 0%, rgba(76,29,149,0.08) 55%, transparent 80%)',
          }}
        />
        {/* Star field micro-dots */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: i % 3 === 0 ? 2 : 1,
                height: i % 3 === 0 ? 2 : 1,
                background: '#c4b5fd',
                left: `${(i * 37 + 11) % 97}%`,
                top: `${(i * 53 + 7) % 88}%`,
                opacity: 0.2 + (i % 5) * 0.1,
                animationDelay: `${(i * 0.43) % 4}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-6 flex flex-col items-center gap-6">
          {/* Canvas planet */}
          <div className="relative">
            {/* Soft shadow beneath planet */}
            <div
              aria-hidden="true"
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-8 rounded-full blur-2xl"
              style={{ background: 'rgba(109,40,217,0.35)' }}
            />
            <BaralPlanet size={260} />
          </div>

          {/* Logo + tagline */}
          <div className="text-center flex flex-col items-center gap-4 mt-2">
            <img
              src="/baral-logo.svg"
              alt="Baral — Estrategia Integral Creativa"
              width="200"
              height="60"
              style={{ filter: 'drop-shadow(0 0 18px rgba(139,92,246,0.45))' }}
            />
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="h-px w-10 opacity-30"
                style={{ background: 'var(--quasar)' }}
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Diagnóstico · Master Web Auditor v2.0 · AUDITOR-X
              </p>
              <span
                aria-hidden
                className="h-px w-10 opacity-30"
                style={{ background: 'var(--quasar)' }}
              />
            </div>
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
