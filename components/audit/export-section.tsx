'use client'

import { Reveal } from '@/components/cosmos/primitives'
import { usePdfDownload } from '@/lib/pdf/generate'
import type { AuditResult } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ExportSection({
  scanResult,
  ga4Data,
}: {
  scanResult: AuditResult | null
  ga4Data?: GA4Metrics | null
}) {
  const [downloading, setDownloading] = useState(false)
  const { pdfState, downloadPdf } = usePdfDownload(scanResult?.domain)

  if (!scanResult) return null

  function handleJSON() {
    setDownloading(true)
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        audit: {
          url: scanResult!.url,
          domain: scanResult!.domain,
          scanDate: scanResult!.scanDate,
          scores: scanResult!.scores,
          findings: scanResult!.findings,
          compactFindings: scanResult!.compactFindings,
          tech: scanResult!.tech,
        },
        analytics: ga4Data ?? null,
        summary: {
          totalFindings: (scanResult!.findings?.length ?? 0) + (scanResult!.compactFindings?.length ?? 0),
          p0: scanResult!.findings?.filter(f => f.priority === 'P0').length ?? 0,
          p1: scanResult!.findings?.filter(f => f.priority === 'P1').length ?? 0,
          ga4Connected: !!ga4Data,
        },
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `baral-audit-${scanResult!.domain}-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setTimeout(() => setDownloading(false), 800)
    }
  }

  const score = scanResult.scores?.overall ?? 0
  const domain = scanResult.domain
  const totalFindings = (scanResult.findings?.length ?? 0) + (scanResult.compactFindings?.length ?? 0)
  const p0 = scanResult.findings?.filter(f => f.priority === 'P0').length ?? 0
  const p1 = scanResult.findings?.filter(f => f.priority === 'P1').length ?? 0

  return (
    <section className="relative border-t border-border/60 px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          {/* Glow background */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, oklch(0.55 0.22 296 / 0.5), transparent 70%)' }}
          />

          <div className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, oklch(0.18 0.035 278) 0%, oklch(0.22 0.055 290) 100%)',
              border: '1px solid oklch(0.8 0.16 305 / 0.25)',
              boxShadow: '0 0 80px -20px oklch(0.62 0.24 300 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.06)',
            }}>

            {/* Top gradient line */}
            <div className="h-px w-full" style={{
              background: 'linear-gradient(90deg, transparent, oklch(0.8 0.16 305 / 0.6), transparent)'
            }} />

            <div className="p-8 sm:p-12">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 font-mono text-[10px] tracking-[0.2em]"
                  style={{ background: 'oklch(0.8 0.16 305 / 0.1)', border: '1px solid oklch(0.8 0.16 305 / 0.25)', color: 'var(--quasar)' }}>
                  <span className="size-1.5 rounded-full bg-[var(--quasar)]" />
                  INFORME LISTO PARA EXPORTAR
                </div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
                  Descarga el diagnóstico completo
                </h2>
                <p className="mt-3 text-muted-foreground text-[15px] leading-relaxed max-w-lg mx-auto text-balance">
                  Lleva el análisis de <strong className="text-foreground">{domain}</strong> a tu equipo o cliente en el formato que necesites.
                </p>
              </div>

              {/* Audit summary chips */}
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  { label: 'Score general', value: `${score}/100`, color: score >= 70 ? 'var(--nova)' : score >= 50 ? 'var(--solar)' : 'var(--pulsar)' },
                  { label: 'Hallazgos totales', value: totalFindings, color: 'var(--star)' },
                  { label: 'Críticos (P0)', value: p0, color: 'var(--pulsar)' },
                  { label: 'Importantes (P1)', value: p1, color: 'var(--solar)' },
                  ...(ga4Data ? [{ label: 'GA4 conectado', value: `${ga4Data.sessions.toLocaleString()} sesiones`, color: 'var(--nova)' }] : []),
                ].map((chip) => (
                  <div key={chip.label} className="flex items-center gap-2 rounded-full px-4 py-2"
                    style={{ background: 'oklch(1 0 0 / 0.04)', border: '1px solid var(--border)' }}>
                    <span className="font-mono text-base font-bold tabular-nums" style={{ color: chip.color }}>{chip.value}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-[0.1em]">{chip.label}</span>
                  </div>
                ))}
              </div>

              {/* Download buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* PDF — main CTA */}
                <button
                  onClick={downloadPdf}
                  disabled={!!pdfState}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl px-8 py-4 font-mono text-[13px] font-bold tracking-wide transition-all disabled:cursor-wait disabled:opacity-80"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.62 0.24 300), oklch(0.55 0.22 296))',
                    boxShadow: '0 0 40px -8px oklch(0.62 0.24 300 / 0.6), inset 0 1px 0 oklch(1 0 0 / 0.15)',
                    color: 'white',
                  }}
                >
                  {pdfState ? <Loader2 className="size-[18px] shrink-0 animate-spin" aria-hidden /> : <PDFIcon />}
                  {pdfState ?? 'Descargar PDF completo'}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                {/* JSON */}
                <button
                  onClick={handleJSON}
                  disabled={downloading}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-2xl px-7 py-4 font-mono text-[13px] font-medium tracking-wide transition-all disabled:opacity-50"
                  style={{
                    background: 'oklch(1 0 0 / 0.04)',
                    border: '1px solid oklch(0.88 0.14 195 / 0.35)',
                    color: 'var(--star)',
                    boxShadow: '0 0 24px -8px oklch(0.88 0.14 195 / 0.2)',
                  }}
                >
                  <JSONIcon />
                  {downloading ? 'Generando…' : `Exportar JSON${ga4Data ? ' + GA4' : ''}`}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </div>

              {/* Footer note */}
              <p className="mt-6 text-center font-mono text-[10px] text-muted-foreground/40 leading-relaxed">
                PDF descarga directamente un documento ejecutivo con portada, resumen, hallazgos P0–P3 con evidencia y dirección de solución, y próximos pasos, explicado en lenguaje simple · JSON incluye datos estructurados + hallazgos + scores{ga4Data ? ' + métricas GA4' : ''}
              </p>
            </div>

            {/* Bottom gradient line */}
            <div className="h-px w-full" style={{
              background: 'linear-gradient(90deg, transparent, oklch(0.8 0.16 305 / 0.3), transparent)'
            }} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function PDFIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

function JSONIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
