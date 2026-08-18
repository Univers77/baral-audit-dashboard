'use client'

import { Reveal, SectionHeader } from '@/components/cosmos/primitives'
import { formatCwv } from '@/lib/psi/parse'
import { isPsiError, type CwvVerdict, type PsiResult, type Strategy } from '@/lib/psi/types'
import type { AuditResult } from '@/lib/scanner/types'
import { AlertTriangle, Film, Gauge, Loader2, Monitor, RefreshCw, Smartphone, Users, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const VERDICT: Record<CwvVerdict, { label: string; color: string; bg: string }> = {
  bueno:       { label: 'BUENO',      color: 'var(--nova)',   bg: 'oklch(0.86 0.19 155 / 0.12)' },
  mejorable:   { label: 'MEJORABLE',  color: 'var(--solar)',  bg: 'oklch(0.85 0.13 88 / 0.12)' },
  deficiente:  { label: 'DEFICIENTE', color: 'var(--pulsar)', bg: 'oklch(0.72 0.2 15 / 0.12)' },
  'sin-datos': { label: 'SIN DATOS',  color: 'rgba(255,255,255,0.4)', bg: 'oklch(1 0 0 / 0.04)' },
}

function scoreColor(n: number | null) {
  if (n === null) return 'rgba(255,255,255,0.35)'
  if (n >= 90) return 'var(--nova)'
  if (n >= 50) return 'var(--solar)'
  return 'var(--pulsar)'
}

function ScoreDial({ label, value }: { label: string; value: number | null }) {
  const c = scoreColor(value)
  const R = 26
  const circ = 2 * Math.PI * R
  const off = circ * (1 - (value ?? 0) / 100)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={68} height={68} viewBox="0 0 68 68" role="img" aria-label={`${label}: ${value ?? 'sin dato'}`}>
        <circle cx={34} cy={34} r={R} fill="none" stroke="oklch(1 0 0 / 0.07)" strokeWidth={5} />
        {value !== null && (
          <circle
            cx={34} cy={34} r={R} fill="none" stroke={c} strokeWidth={5}
            strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
            transform="rotate(-90 34 34)"
            style={{ transition: 'stroke-dashoffset .9s ease' }}
          />
        )}
        <text x={34} y={39} textAnchor="middle" fill={c} fontSize={16} fontWeight={700}>
          {value ?? '—'}
        </text>
      </svg>
      <span className="font-mono text-[9.5px] tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label.toUpperCase()}
      </span>
    </div>
  )
}

/** Barra de reparto de usuarios reales: bueno / mejorable / deficiente. */
function DistBar({ d }: { d: [number, number, number] }) {
  const seg = [
    { v: d[0], c: 'var(--nova)' },
    { v: d[1], c: 'var(--solar)' },
    { v: d[2], c: 'var(--pulsar)' },
  ]
  return (
    <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.06)' }}>
      {seg.map((s, i) => (
        <span key={i} style={{ width: `${s.v * 100}%`, background: s.c }} />
      ))}
    </div>
  )
}

export function PsiSection({ scanResult }: { scanResult: AuditResult | null }) {
  const [strategy, setStrategy] = useState<Strategy>('mobile')
  const [data, setData] = useState<Record<Strategy, PsiResult | null>>({ mobile: null, desktop: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ msg: string; hint?: string; quota?: boolean } | null>(null)
  const [openMetric, setOpenMetric] = useState<string | null>(null)

  const url = scanResult?.url

  const run = useCallback(async (s: Strategy, force = false) => {
    if (!url) return
    if (data[s] && !force) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/psi?url=${encodeURIComponent(url)}&strategy=${s}`)
      const json = await res.json()
      if (!res.ok || isPsiError(json)) {
        setError({ msg: json.error ?? 'No se pudo consultar PageSpeed', hint: json.hint, quota: json.quotaExceeded })
      } else {
        setData(prev => ({ ...prev, [s]: json }))
      }
    } catch (e) {
      setError({ msg: e instanceof Error ? e.message : 'Error de red' })
    } finally {
      setLoading(false)
    }
  }, [url, data])

  // Se dispara al aparecer un resultado nuevo. Solo móvil: es la estrategia que
  // Google usa para indexar, y cada consulta cuesta cuota.
  useEffect(() => {
    if (!url) return
    setData({ mobile: null, desktop: null })
    setError(null)
    const t = setTimeout(() => run('mobile', true), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  if (!scanResult) return null

  const current = data[strategy]
  const field = current?.field

  return (
    <section id="pagespeed" className="relative border-t border-border/60 px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Google PageSpeed Insights"
            title={
              <>
                Lo que mide <span className="text-gradient-quasar">Google directamente</span>
              </>
            }
            description="Consulta en vivo a la API oficial de PageSpeed. Trae dos cosas distintas que conviene no confundir: la experiencia de usuarios reales de Chrome (lo que Google usa para posicionar) y una simulación de laboratorio con Lighthouse."
          />
        </Reveal>

        {/* Selector de dispositivo */}
        <Reveal delay={50}>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            {(['mobile', 'desktop'] as const).map(s => {
              const on = strategy === s
              const Icon = s === 'mobile' ? Smartphone : Monitor
              return (
                <button
                  key={s}
                  onClick={() => { setStrategy(s); run(s) }}
                  aria-pressed={on}
                  className="flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.08em] transition-all"
                  style={{
                    background: on ? 'oklch(0.8 0.16 305 / 0.14)' : 'oklch(1 0 0 / 0.03)',
                    border: `1px solid ${on ? 'var(--quasar)' : 'var(--border)'}`,
                    color: on ? 'var(--quasar)' : 'var(--muted-foreground)',
                  }}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {s === 'mobile' ? 'MÓVIL' : 'ESCRITORIO'}
                  {s === 'mobile' && (
                    <span className="font-mono text-[8.5px] opacity-60">· indexa Google</span>
                  )}
                </button>
              )
            })}
            {current && (
              <button
                onClick={() => run(strategy, true)}
                disabled={loading}
                className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 font-mono text-[10px] transition-opacity disabled:opacity-40"
                style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
              >
                <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                Volver a medir
              </button>
            )}
          </div>
        </Reveal>

        {/* Carga */}
        {loading && !current && (
          <Reveal delay={70}>
            <div className="glass mt-5 flex items-center gap-3 rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
              <Loader2 className="size-4 animate-spin" style={{ color: 'var(--quasar)' }} aria-hidden />
              <div>
                <p className="text-[13.5px]">Google está cargando el sitio en un dispositivo emulado…</p>
                <p className="mt-0.5 font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Suele tardar entre 15 y 40 segundos.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* Error */}
        {error && !current && (
          <Reveal delay={70}>
            <div
              className="mt-5 flex items-start gap-3 rounded-2xl p-5"
              style={{ border: '1px solid oklch(0.85 0.13 88 / 0.3)', background: 'oklch(0.85 0.13 88 / 0.05)' }}
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--solar)' }} aria-hidden />
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium" style={{ color: 'var(--solar)' }}>{error.msg}</p>
                {error.hint && (
                  <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    {error.hint}
                  </p>
                )}
                <button
                  onClick={() => run(strategy, true)}
                  className="mt-3 rounded-lg px-3 py-1.5 font-mono text-[11px] transition-opacity hover:opacity-80"
                  style={{ background: 'oklch(1 0 0 / 0.05)', border: '1px solid var(--border)' }}
                >
                  Reintentar
                </button>
              </div>
            </div>
          </Reveal>
        )}

        {current && (
          <>
            {/* Puntajes Lighthouse */}
            <Reveal delay={70}>
              <div className="glass mt-5 rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Gauge className="size-3" aria-hidden />
                    PUNTAJES LIGHTHOUSE · {strategy === 'mobile' ? 'MÓVIL' : 'ESCRITORIO'}
                  </p>
                  <span className="font-mono text-[9.5px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    v{current.lighthouseVersion}
                  </span>
                </div>
                <div className="flex flex-wrap justify-around gap-4">
                  <ScoreDial label="Rendimiento"   value={current.scores.performance} />
                  <ScoreDial label="Accesibilidad" value={current.scores.accessibility} />
                  <ScoreDial label="Buenas prác."  value={current.scores.bestPractices} />
                  <ScoreDial label="SEO"           value={current.scores.seo} />
                </div>
                <p className="mt-4 border-t pt-3 text-[11.5px] leading-relaxed" style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.4)' }}>
                  Estos puntajes vienen de una simulación en laboratorio, no de visitantes reales. Sirven para
                  diagnosticar, pero Google no los usa como señal de ranking: para eso mira los datos de campo.
                </p>
              </div>
            </Reveal>

            {/* Tira de progreso de carga (filmstrip) */}
            {current.filmstrip.length > 0 && (
              <Reveal delay={90}>
                <div className="glass mt-5 rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
                  <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Film className="size-3" aria-hidden />
                    CÓMO SE VE LA CARGA, FOTOGRAMA A FOTOGRAMA
                  </p>
                  <p className="mt-1 mb-4 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                    Cada imagen es lo que un visitante realmente ve en ese instante, no un número abstracto. Si el
                    sitio tarda en mostrar contenido, se nota en que las primeras miniaturas quedan en blanco.
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {current.filmstrip.map((f, i) => (
                      <figure key={i} className="shrink-0" style={{ width: 84 }}>
                        <div
                          className="overflow-hidden rounded-lg"
                          style={{ border: '1px solid var(--border)', background: '#0a0b14', aspectRatio: '9 / 16' }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.data}
                            alt={`Estado de carga a los ${(f.timing / 1000).toFixed(1)} s`}
                            className="size-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                        <figcaption className="mt-1 text-center font-mono text-[9px] tabular-nums" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {(f.timing / 1000).toFixed(1)}s
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Datos de campo — CrUX */}
            <Reveal delay={110}>
              <div className="glass mt-5 rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Users className="size-3" aria-hidden />
                    USUARIOS REALES · ÚLTIMOS 28 DÍAS
                  </p>
                  {field?.available && (
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[9.5px] font-bold"
                      style={{ background: VERDICT[field.overall].bg, color: VERDICT[field.overall].color }}
                    >
                      {VERDICT[field.overall].label}
                    </span>
                  )}
                </div>

                {!field?.available ? (
                  <div className="mt-3 rounded-2xl px-5 py-6" style={{ background: 'oklch(1 0 0 / 0.02)', border: '1px dashed var(--border)' }}>
                    <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
                      El sitio no tiene suficiente tráfico para aparecer en el reporte de experiencia de usuario de Chrome.
                    </p>
                    <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      No es un fallo del sitio: Google solo publica estos datos cuando hay volumen suficiente para que
                      sean estadísticamente representativos. Mientras tanto, las métricas de laboratorio de abajo son
                      la mejor referencia disponible.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 mb-4 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {field.fromOrigin
                        ? 'Esta URL no tiene tráfico suficiente por sí sola, así que se muestran los datos agregados de todo el dominio.'
                        : 'Datos de visitantes reales en esta URL. Es exactamente lo que Google usa como señal de ranking.'}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {field.metrics.map(m => {
                        const v = VERDICT[m.verdict]
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
                              border: `1px solid ${open ? v.color : 'var(--border)'}`,
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[12px] font-medium leading-snug">{m.label}</span>
                              {m.isCoreWebVital && (
                                <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold"
                                  style={{ background: 'oklch(0.8 0.16 305 / 0.15)', color: 'var(--quasar)' }}>
                                  CWV
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="font-mono text-xl font-bold tabular-nums" style={{ color: v.color }}>
                                {formatCwv(m)}
                              </span>
                              <span className="font-mono text-[9px]" style={{ color: v.color }}>{v.label}</span>
                            </div>
                            <DistBar d={m.distribution} />
                            <p className="mt-1.5 font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {Math.round(m.distribution[0] * 100)}% buena · {Math.round(m.distribution[1] * 100)}% media · {Math.round(m.distribution[2] * 100)}% mala
                            </p>
                            {open && (
                              <p className="mt-2.5 border-t pt-2.5 text-[11.5px] leading-relaxed" style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.6)' }}>
                                {m.what}
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </Reveal>

            {/* Oportunidades */}
            {current.opportunities.length > 0 && (
              <Reveal delay={150}>
                <div className="glass mt-5 rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
                  <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <Zap className="size-3" aria-hidden />
                    OPORTUNIDADES · AHORRO ESTIMADO
                  </p>
                  <p className="mt-1 mb-4 text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>
                    Lo que Google calcula que se ganaría al corregir cada punto, ordenado por impacto.
                  </p>
                  <ul className="flex flex-col gap-2">
                    {current.opportunities.map(o => (
                      <li key={o.key} className="rounded-xl p-3.5" style={{ background: 'oklch(1 0 0 / 0.025)', border: '1px solid var(--border)' }}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[12.5px] font-medium">{o.title}</span>
                          <span className="shrink-0 font-mono text-[12px] font-bold" style={{ color: 'var(--solar)' }}>
                            −{(o.savingsMs / 1000).toFixed(2)} s
                            {o.savingsBytes > 0 && (
                              <span className="ml-2 font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {(o.savingsBytes / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {o.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )}

            {/* Métricas de laboratorio + auditorías fallidas */}
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              {current.lab.length > 0 && (
                <Reveal delay={190}>
                  <div className="glass h-full rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
                    <p className="mb-4 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      MÉTRICAS DE LABORATORIO
                    </p>
                    <ul className="flex flex-col gap-2.5">
                      {current.lab.map(l => (
                        <li key={l.key} className="flex items-baseline justify-between gap-3">
                          <span className="text-[12.5px]" style={{ color: 'var(--muted-foreground)' }}>{l.label}</span>
                          <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums" style={{ color: scoreColor(l.score === null ? null : l.score * 100) }}>
                            {l.display}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {current.totalBytes > 0 && (
                      <p className="mt-4 border-t pt-3 font-mono text-[11px]" style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.4)' }}>
                        Peso total transferido: {(current.totalBytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                </Reveal>
              )}

              {current.failedAudits.length > 0 && (
                <Reveal delay={230}>
                  <div className="glass h-full rounded-3xl p-6" style={{ border: '1px solid var(--border)' }}>
                    <p className="mb-4 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      AUDITORÍAS NO SUPERADAS ({current.failedAudits.length})
                    </p>
                    <ul className="flex flex-col gap-2">
                      {current.failedAudits.map(a => (
                        <li key={a.key} className="flex items-start gap-2.5">
                          <span
                            className="mt-1 size-1.5 shrink-0 rounded-full"
                            style={{ background: a.score < 0.5 ? 'var(--pulsar)' : 'var(--solar)' }}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="text-[12.5px] leading-snug">{a.title}</p>
                            <p className="mt-0.5 font-mono text-[9.5px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {a.category}{a.displayValue ? ` · ${a.displayValue}` : ''}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
            </div>

            <Reveal delay={260}>
              <p className="mt-4 font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Fuente: API oficial de Google PageSpeed Insights, consultada el{' '}
                {new Date(current.fetchedAt).toLocaleString('es-BO')}. URL analizada: {current.finalUrl}
              </p>
            </Reveal>
          </>
        )}
      </div>
    </section>
  )
}
