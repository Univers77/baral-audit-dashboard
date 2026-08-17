'use client'

import { Reveal, SectionHeader } from '@/components/cosmos/primitives'
import {
  COMPARABLE_LABELS,
  VERDICT_META,
  benchmarkScore,
  comparableRow,
  metricsFor,
  type Competitor,
} from '@/lib/benchmarks'
import type { AuditResult } from '@/lib/scanner/types'
import { Loader2, Plus, Search, Trash2, X, Info } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

const MAX_COMPETIDORES = 3

function normalizeDomain(input: string): string {
  const s = input.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
  return s.toLowerCase()
}

export function CompetitiveSection({ scanResult }: { scanResult: AuditResult | null }) {
  const [input, setInput] = useState('')
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [openMetric, setOpenMetric] = useState<string | null>(null)
  const esRefs = useRef<Record<string, EventSource>>({})

  const scanCompetitor = useCallback((url: string) => {
    const domain = normalizeDomain(url)
    const full = /^https?:\/\//i.test(url) ? url : `https://${domain}`

    setCompetitors(prev => [...prev, { url: full, domain, status: 'escaneando' }])

    const es = new EventSource(`/api/analyze?url=${encodeURIComponent(full)}`)
    esRefs.current[domain] = es

    es.addEventListener('result', e => {
      const result: AuditResult = JSON.parse((e as MessageEvent).data)
      setCompetitors(prev => prev.map(c => (c.domain === domain ? { ...c, status: 'listo', result } : c)))
    })
    es.addEventListener('done', () => { es.close(); delete esRefs.current[domain] })
    es.addEventListener('error', e => {
      es.close()
      let msg = 'No se pudo analizar el sitio'
      try { msg = JSON.parse((e as MessageEvent).data).message } catch {}
      setCompetitors(prev => prev.map(c => (c.domain === domain ? { ...c, status: 'error', error: msg } : c)))
    })
    es.onerror = () => {
      es.close()
      setCompetitors(prev =>
        prev.map(c => (c.domain === domain && c.status === 'escaneando'
          ? { ...c, status: 'error', error: 'El sitio no respondió o bloqueó la conexión' }
          : c)),
      )
    }
  }, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const domain = normalizeDomain(input)
    if (!domain || !domain.includes('.')) return
    if (competitors.length >= MAX_COMPETIDORES) return
    if (competitors.some(c => c.domain === domain)) return
    if (scanResult && domain === normalizeDomain(scanResult.domain)) return
    scanCompetitor(input)
    setInput('')
  }

  const removeCompetitor = (domain: string) => {
    esRefs.current[domain]?.close()
    delete esRefs.current[domain]
    setCompetitors(prev => prev.filter(c => c.domain !== domain))
  }

  // Estado vacío: sin escaneo todavía
  if (!scanResult) {
    return (
      <section id="competencia" className="relative border-t border-border/60 px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Posición competitiva"
            title="Posición frente al mercado"
            description="Analice un sitio para ver su cumplimiento frente a los estándares publicados y compararlo con los competidores que elija."
          />
        </div>
      </section>
    )
  }

  const metrics = metricsFor(scanResult)
  const bScore = benchmarkScore(scanResult)
  const listos = competitors.filter(c => c.status === 'listo' && c.result)

  return (
    <section id="competencia" className="relative border-t border-border/60 px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Posición competitiva"
            title={
              <>
                Cómo se compara <span className="text-gradient-quasar">{scanResult.domain}</span>
              </>
            }
            description="Primero contra estándares públicos con fuente citable. Después, contra los competidores que usted elija: se analizan en el momento con el mismo motor, de modo que la comparación sea pareja."
          />
        </Reveal>

        {/* ── Cumplimiento de estándares ── */}
        <Reveal delay={60}>
          <div className="glass mt-8 rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  CUMPLIMIENTO DE ESTÁNDARES PÚBLICOS
                </p>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
                  Cada umbral tiene fuente. Seleccione una métrica para ver por qué importa.
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-3xl font-bold tabular-nums text-gradient-quasar">{bScore}</p>
                <p className="font-mono text-[9px] tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  DE 100
                </p>
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map(m => {
                const meta = VERDICT_META[m.verdict]
                const open = openMetric === m.key
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setOpenMetric(open ? null : m.key)}
                    aria-expanded={open}
                    className="rounded-2xl p-4 text-left transition-colors"
                    style={{
                      background: open ? 'oklch(1 0 0 / 0.05)' : 'oklch(1 0 0 / 0.025)',
                      border: `1px solid ${open ? meta.color : 'var(--border)'}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12.5px] font-medium leading-snug">{m.label}</span>
                      <Info className="mt-0.5 size-3 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} aria-hidden />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-lg font-bold tabular-nums" style={{ color: meta.color }}>
                        {m.format(m.value)}
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-[9.5px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      objetivo {m.lowerIsBetter ? '≤' : '≥'} {m.format(m.good)} · {m.source}
                    </p>
                    {open && (
                      <p className="mt-2.5 border-t pt-2.5 text-[11.5px] leading-relaxed" style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.6)' }}>
                        {m.why}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Reveal>

        {/* ── Competidores reales ── */}
        <Reveal delay={100}>
          <div className="glass mt-5 rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
            <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              COMPARACIÓN DIRECTA
            </p>
            <p className="mt-1 mb-4 text-[13px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Agregue hasta {MAX_COMPETIDORES} competidores. Cada uno se analiza en vivo con el mismo motor y los
              mismos criterios, así la comparación es pareja y verificable.
            </p>

            <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search size={14} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="competidor.com"
                  disabled={competitors.length >= MAX_COMPETIDORES}
                  aria-label="Dominio del competidor"
                  className="w-full rounded-xl py-2.5 pr-3 pl-9 font-mono text-[13px] text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-40"
                  style={{ background: 'oklch(0.12 0.01 265 / 0.8)', border: '1px solid var(--border)' }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || competitors.length >= MAX_COMPETIDORES}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-mono text-[12px] font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#5B2DBA)' }}
              >
                <Plus size={14} /> Comparar
              </button>
            </form>

            {competitors.length >= MAX_COMPETIDORES && (
              <p className="mt-2 font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Máximo {MAX_COMPETIDORES} competidores por análisis.
              </p>
            )}

            {/* Chips de estado */}
            {competitors.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {competitors.map(c => (
                  <span
                    key={c.domain}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[11px]"
                    style={{
                      background: 'oklch(1 0 0 / 0.04)',
                      border: `1px solid ${c.status === 'error' ? 'oklch(0.72 0.2 15 / 0.4)' : 'var(--border)'}`,
                      color: c.status === 'error' ? 'var(--pulsar)' : 'var(--muted-foreground)',
                    }}
                  >
                    {c.status === 'escaneando' && <Loader2 size={11} className="animate-spin" />}
                    {c.status === 'error' && <X size={11} />}
                    {c.domain}
                    {c.status === 'listo' && c.result && (
                      <strong style={{ color: 'var(--star)' }}>{c.result.scores.overall}</strong>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCompetitor(c.domain)}
                      aria-label={`Quitar ${c.domain}`}
                      className="opacity-50 transition-opacity hover:opacity-100"
                    >
                      <Trash2 size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {competitors.some(c => c.status === 'error') && (
              <p className="mt-2 text-[11.5px]" style={{ color: 'var(--pulsar)' }}>
                {competitors.find(c => c.status === 'error')?.error}
              </p>
            )}

            {/* Tabla comparativa */}
            {listos.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-border/70 border-b">
                      <th scope="col" className="px-3 py-2.5 font-mono text-[10px] tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        MÉTRICA
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-center font-mono text-[10px] tracking-[0.12em]" style={{ color: 'var(--quasar)', background: 'oklch(0.8 0.16 305 / 0.07)' }}>
                        {scanResult.domain.toUpperCase()}
                      </th>
                      {listos.map(c => (
                        <th key={c.domain} scope="col" className="px-3 py-2.5 text-center font-mono text-[10px] tracking-[0.12em]" style={{ color: 'var(--muted-foreground)' }}>
                          {c.domain.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARABLE_LABELS.map(({ key, label, lowerIsBetter, fmt }) => {
                      const mine = comparableRow(scanResult)[key]
                      const theirs = listos.map(c => comparableRow(c.result!)[key])
                      const all = [mine, ...theirs]
                      const nums = all.filter((v): v is number => typeof v === 'number')
                      const best = nums.length
                        ? (lowerIsBetter ? Math.min(...nums) : Math.max(...nums))
                        : null

                      const cell = (v: number | boolean, isMine: boolean) => {
                        const isBest = typeof v === 'number' ? v === best : v === true
                        return (
                          <td
                            key={`${key}-${isMine ? 'me' : Math.random()}`}
                            className="px-3 py-3 text-center align-middle"
                            style={{ background: isMine ? 'oklch(0.8 0.16 305 / 0.06)' : undefined }}
                          >
                            <span
                              className="font-mono text-[13px] font-semibold tabular-nums"
                              style={{ color: isBest ? 'var(--nova)' : 'rgba(255,255,255,0.75)' }}
                            >
                              {fmt(v)}
                            </span>
                            {isBest && nums.length > 1 && (
                              <span className="mt-1 block font-mono text-[8.5px]" style={{ color: 'var(--nova)' }}>
                                MEJOR
                              </span>
                            )}
                          </td>
                        )
                      }

                      return (
                        <tr key={key} className="border-border/50 border-b">
                          <th scope="row" className="px-3 py-3 text-[12.5px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            {label}
                          </th>
                          {cell(mine, true)}
                          {listos.map((c, i) => cell(theirs[i], false))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="mt-3 font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Todos los sitios se midieron con el mismo motor el {new Date(scanResult.scanDate).toLocaleDateString('es-BO')}.
                  Son datos observados en el HTML servido, no estimaciones.
                </p>
              </div>
            ) : (
              competitors.length === 0 && (
                <div
                  className="mt-5 rounded-2xl px-5 py-8 text-center"
                  style={{ background: 'oklch(1 0 0 / 0.02)', border: '1px dashed var(--border)' }}
                >
                  <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
                    Sin competidores cargados todavía.
                  </p>
                  <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Preferimos no mostrar competidores inventados. Agregue los dominios con los que compite de
                    verdad y se miden en el momento.
                  </p>
                </div>
              )
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
