'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { metricTiles } from '@/lib/audit-data'
import { TrendingDown, TrendingUp } from 'lucide-react'

export function MetricsSection() {
  return (
    <section id="metricas" className="relative px-5 py-24 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Telemetría"
            title={
              <>
                Señales que llegan desde <span className="text-gradient-cool">tu propio sistema</span>
              </>
            }
            description="Lecturas crudas comparadas contra el umbral que el mercado ya considera mínimo. Rojo significa que estás por debajo de la línea de flotación, no que sea difícil de arreglar."
          />
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricTiles.map((m, i) => {
            const color = m.good ? 'var(--nova)' : 'var(--pulsar)'
            const glow = m.good ? 'oklch(0.86 0.19 155 / 0.35)' : 'oklch(0.72 0.2 15 / 0.4)'
            return (
              <Reveal key={m.label} delay={Math.min(i * 70, 350)}>
                <TiltCard glow={glow} className="glass h-full rounded-3xl p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.14em] uppercase">
                      {m.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold"
                      style={{ background: m.good ? 'oklch(0.86 0.19 155 / 0.12)' : 'oklch(0.72 0.2 15 / 0.12)', color }}
                    >
                      {m.good ? (
                        <TrendingUp aria-hidden className="size-2.5" />
                      ) : (
                        <TrendingDown aria-hidden className="size-2.5" />
                      )}
                      {m.good ? 'OK' : 'GAP'}
                    </span>
                  </div>

                  <div className="mt-5 font-mono text-[2rem] leading-none font-bold tabular-nums" style={{ color }}>
                    {m.value}
                  </div>

                  <div className="text-muted-foreground/60 mt-2 font-mono text-[11px]">
                    benchmark <span className="text-foreground/80">{m.benchmark}</span>
                  </div>

                  <div className="relative mt-5 h-1.5 overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.07)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${m.pct}%`, background: color, boxShadow: `0 0 12px 1px ${glow}` }}
                    />
                    <span
                      aria-hidden
                      className="absolute inset-y-[-4px] w-[2px]"
                      style={{ left: '90%', background: 'oklch(0.96 0.01 265 / 0.45)' }}
                    />
                  </div>
                  <div className="text-muted-foreground/50 mt-2 flex justify-between font-mono text-[9px]">
                    <span>ahora</span>
                    <span>objetivo</span>
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
