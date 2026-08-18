'use client'

import { site, totalFindings } from '@/lib/audit-data'
import { CosmicButton, Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import { BaralPlanet } from '@/components/audit/baral-planet'
import { BaralLogo } from '@/components/brand/baral-logo'
import { usePdfDownload } from '@/lib/pdf/generate'
import type { AuditResult } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'
import { getHistory } from '@/lib/history'
import { useEffect, useState } from 'react'
import type { ScanHistoryEntry } from '@/lib/ga4/types'

export function FooterSection({
  scanResult,
  ga4Data,
}: {
  scanResult?: AuditResult | null
  ga4Data?: GA4Metrics | null
}) {
  const [history, setHistory] = useState<ScanHistoryEntry[]>([])
  const { pdfState, downloadPdf } = usePdfDownload(scanResult?.domain)

  useEffect(() => {
    setHistory(getHistory())
  }, [scanResult])

  function downloadJSON() {
    const payload = {
      exportedAt: new Date().toISOString(),
      scan: scanResult ?? null,
      ga4: ga4Data ?? null,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-${scanResult?.domain ?? 'report'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <>


      <section className="relative overflow-hidden border-t border-border/60 py-12 md:py-16">
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
              <CosmicButton onClick={downloadPdf} disabled={!!pdfState}>
                {pdfState ?? 'Descargar PDF'}
              </CosmicButton>
              <CosmicButton variant="outline" onClick={downloadJSON}>
                Exportar JSON{ga4Data ? ' + GA4' : ''}
              </CosmicButton>
              <CosmicButton
                variant="outline"
                onClick={() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver plan por ondas
              </CosmicButton>
            </div>

            {/* Scan history */}
            {history.length > 0 && (
              <div className="mt-8 w-full max-w-lg mx-auto">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
                  Historial de análisis
                </p>
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                      style={{ background: 'oklch(1 0 0 / 0.02)', border: '1px solid var(--border)' }}
                    >
                      <span className="font-mono text-xs font-semibold tabular-nums text-gradient-quasar">
                        {entry.score}
                      </span>
                      <span className="flex-1 truncate font-mono text-[11px] text-foreground/70">{entry.url}</span>
                      {entry.ga4Connected && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px]"
                          style={{ background: 'oklch(0.86 0.19 155 / 0.1)', color: 'var(--nova)', border: '1px solid oklch(0.86 0.19 155 / 0.2)' }}>
                          GA4
                        </span>
                      )}
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground/40">
                        {new Date(entry.timestamp).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Baral planet brand closing */}
      <section className="relative border-t border-border/60 py-14 overflow-hidden planet-section-glow">
        {/* Deep space background wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 110%, rgba(91,45,186,0.28) 0%, rgba(76,29,149,0.10) 55%, transparent 80%)',
          }}
        />

        {/* Baral B watermark — ultra-subtle tiled background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ opacity: 0.022 }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i % 4) * 26 + 2}%`,
                top: `${Math.floor(i / 4) * 38 + 8}%`,
                width: 52, height: 52,
              }}
            >
              {/* Baral B shape — pure CSS approximation for watermark */}
              <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="52" height="52" rx="10" fill="#a78bfa"/>
                <path d="M16 14h14c5.5 0 9 2.8 9 7.2 0 2.8-1.6 5-4 6.2 3.2 1.2 5 3.8 5 7 0 5-3.8 8.6-10 8.6H16V14zm7 10.8h5.8c2.2 0 3.4-1.2 3.4-3s-1.2-2.8-3.4-2.8H23v5.8zm0 12.4h6.6c2.6 0 4-1.4 4-3.6s-1.4-3.4-4-3.4H23v7z" fill="white"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Star field */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-twinkle"
              style={{
                width: i % 4 === 0 ? 2.5 : 1.2,
                height: i % 4 === 0 ? 2.5 : 1.2,
                background: i % 5 === 0 ? '#c4b5fd' : '#e9d5ff',
                left: `${(i * 37 + 11) % 97}%`,
                top: `${(i * 53 + 7) % 90}%`,
                opacity: 0.15 + (i % 5) * 0.1,
                animationDelay: `${(i * 0.43) % 5}s`,
                animationDuration: `${2.5 + (i % 4)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl px-6 flex flex-col items-center gap-8">
          {/* Planet with floating animation */}
          <div className="relative animate-planet-bob" style={{ filter: 'drop-shadow(0 30px 60px rgba(91,45,186,0.5))' }}>
            {/* Orbital ring decoration */}
            <div
              aria-hidden="true"
              className="absolute inset-[-20%] rounded-full animate-slow-spin"
              style={{
                border: '1px dashed oklch(0.8 0.16 305 / 0.15)',
                transform: 'rotateX(72deg)',
              }}
            />
            {/* Pulse rings */}
            <div
              aria-hidden="true"
              className="absolute inset-[-8%] rounded-full"
              style={{
                border: '1px solid oklch(0.8 0.16 305 / 0.2)',
                animation: 'pulse-ring 3.5s ease-out infinite',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-[-14%] rounded-full"
              style={{
                border: '1px solid oklch(0.8 0.16 305 / 0.12)',
                animation: 'pulse-ring 3.5s ease-out infinite 1.2s',
              }}
            />
            <BaralPlanet size={300} />
          </div>

          {/* Logo + tagline below planet */}
          <div className="text-center flex flex-col items-center gap-5">
            {/* Marca oficial. El arte ya trae su halo: apilarle blur + doble
                drop-shadow lo despegaba del fondo en vez de asentarlo. */}
            <BaralLogo variant="lockup" height={132} />

            {/* Separator line */}
            <div className="flex items-center gap-4 w-full max-w-xs">
              <span className="flex-1 h-px opacity-20" style={{ background: 'linear-gradient(90deg, transparent, var(--quasar))' }} />
              <span className="size-1.5 rounded-full opacity-60" style={{ background: 'var(--quasar)' }} />
              <span className="flex-1 h-px opacity-20" style={{ background: 'linear-gradient(90deg, var(--quasar), transparent)' }} />
            </div>

            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60">
              Diagnóstico · Master Web Auditor v2.0
            </p>

            {/* Data pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {[
                { label: 'SEO', icon: '🔍' },
                { label: 'Performance', icon: '⚡' },
                { label: 'Accesibilidad', icon: '♿' },
                { label: 'Conversión', icon: '🎯' },
                { label: 'Seguridad', icon: '🛡️' },
              ].map((pill) => (
                <span
                  key={pill.label}
                  className="glass flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[9.5px] text-muted-foreground/70"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {pill.icon} {pill.label}
                </span>
              ))}
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
