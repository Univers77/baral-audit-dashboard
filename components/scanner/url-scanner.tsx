'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Loader2, ChevronDown, ChevronUp, Clock, Globe, AlertTriangle, CheckCircle2, XCircle, Sparkles, Target, Zap, TrendingUp, ShieldAlert, BarChart2 } from 'lucide-react'
import type { AuditResult } from '@/lib/scanner/types'

type ProgressMsg = { step: number; total: number; message: string; pct: number }
type HistoryEntry = { domain: string; url: string; scanDate: string; overall: number }

function scoreColor(n: number) {
  if (n >= 80) return '#22c55e'
  if (n >= 60) return '#eab308'
  if (n >= 40) return '#f97316'
  return '#ef4444'
}

function PriorityBadge({ p }: { p: string }) {
  const colors: Record<string, string> = {
    P0: '#ef4444', P1: '#f97316', P2: '#eab308', P3: '#6b7280',
  }
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
      style={{ background: colors[p] + '22', color: colors[p], border: `1px solid ${colors[p]}44` }}
    >
      {p}
    </span>
  )
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const R = 28
  const circ = 2 * Math.PI * R
  const stroke = circ * (1 - score / 100)
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={70} height={70} viewBox="0 0 70 70">
        <circle cx={35} cy={35} r={R} fill="none" stroke="#ffffff0f" strokeWidth={6} />
        <circle
          cx={35} cy={35} r={R} fill="none"
          stroke={color} strokeWidth={6}
          strokeDasharray={circ}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={35} y={39} textAnchor="middle" fill="white" fontSize={13} fontWeight={700}>{score}</text>
      </svg>
      <span className="text-center font-mono text-[10px] tracking-wider" style={{ color: '#ffffff66' }}>{label}</span>
    </div>
  )
}

export function UrlScanner({ onResult }: { onResult?: (r: AuditResult) => void } = {}) {
  const [inputUrl, setInputUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<ProgressMsg | null>(null)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showFindings, setShowFindings] = useState(true)
  const [showCompact, setShowCompact] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const gotResultRef = useRef(false)

  // Restaurar análisis previo desde sessionStorage o URL params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const urlParam = params.get('url')
      const saved = sessionStorage.getItem('auditorx-last-result')
      if (saved) {
        const parsed: AuditResult = JSON.parse(saved)
        setResult(parsed)
        setInputUrl(parsed.url)
      } else if (urlParam) {
        setInputUrl(urlParam)
      }
    } catch {}
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history')
      if (res.ok) setHistory(await res.json())
    } catch {}
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const startScan = useCallback((url: string) => {
    if (!url.trim()) return
    esRef.current?.close()
    gotResultRef.current = false
    setScanning(true)
    setProgress(null)
    setResult(null)
    setError(null)

    const es = new EventSource(`/api/analyze?url=${encodeURIComponent(url.trim())}`)
    esRef.current = es

    es.addEventListener('progress', (e) => {
      setProgress(JSON.parse(e.data))
    })
    es.addEventListener('result', (e) => {
      gotResultRef.current = true
      const r: AuditResult = JSON.parse(e.data)
      setResult(r)
      onResult?.(r)
      loadHistory()
      // Persistir para sobrevivir recarga
      try {
        sessionStorage.setItem('auditorx-last-result', JSON.stringify(r))
        const u = new URL(window.location.href)
        u.searchParams.set('url', r.url)
        window.history.replaceState({}, '', u.toString())
      } catch {}
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    })
    es.addEventListener('done', () => {
      setScanning(false)
      es.close()
    })
    es.addEventListener('error', (e) => {
      // Evento 'error' nombrado = error de aplicación enviado por el servidor
      es.close()
      try { setError(JSON.parse((e as MessageEvent).data).message) } catch { setError('Error de conexión con el servidor') }
      setScanning(false)
    })
    es.onerror = () => {
      // onerror del EventSource nativo = la conexión se cerró (normal o por error de red).
      // Si ya recibimos el resultado, ignorar. Si no, mostrar error.
      es.close() // siempre cerrar para evitar loop de reconexión automática
      if (!gotResultRef.current) {
        setScanning(false)
        setError('El análisis tardó demasiado o el sitio bloqueó la conexión. Intenta de nuevo.')
      }
    }
  }, [loadHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startScan(inputUrl)
  }

  return (
    <section id="scanner" className="relative px-5 pt-8 pb-12 sm:px-8">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className="glass mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.16em]"
            style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            <Globe size={11} />
            ESCÁNER DE SITIOS WEB · AUDITOR-X
          </div>
          <h2 className="font-display mb-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Analiza cualquier URL
          </h2>
          <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
            Pega una URL y obtén un diagnóstico SEO + performance en segundos
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              disabled={scanning}
              className="w-full rounded-xl py-3 pr-4 pl-10 font-mono text-[14px] text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-50"
              style={{
                background: 'oklch(0.12 0.01 265 / 0.8)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={scanning || !inputUrl.trim()}
            className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white text-[14px] transition-all disabled:opacity-50"
            style={{
              background: scanning ? '#ffffff14' : 'linear-gradient(135deg,#7C3AED,#5B2DBA)',
              boxShadow: scanning ? 'none' : '0 0 22px 2px #7C3AED44',
            }}
          >
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {scanning ? 'Analizando…' : 'Analizar'}
          </button>
        </form>

        {/* History pills */}
        {history.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {history.slice(0, 6).map(h => (
              <button
                key={h.domain}
                type="button"
                onClick={() => { setInputUrl(h.url); startScan(h.url) }}
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] transition-all hover:border-purple-500/50"
                style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: scoreColor(h.overall) }}
                />
                {h.domain}
                <span className="font-mono text-[10px]" style={{ color: scoreColor(h.overall) }}>{h.overall}</span>
              </button>
            ))}
          </div>
        )}

        {/* Progress */}
        {scanning && progress && (
          <div
            className="glass mb-6 rounded-2xl p-5"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] text-white">{progress.message}</span>
              <span className="font-mono text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
                {progress.step}/{progress.total}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#ffffff0f' }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress.pct}%`,
                  background: 'linear-gradient(90deg,#7C3AED,#00d4ff)',
                  boxShadow: '0 0 12px 1px #7C3AED88',
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="glass mb-6 flex items-start gap-3 rounded-2xl p-4"
            style={{ border: '1px solid #ef444433', background: '#ef44440a' }}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="mb-0.5 text-[13px] font-medium text-red-400">Error de análisis</p>
              <p className="text-[12px]" style={{ color: 'var(--muted-foreground)' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Result panel */}
        {result && (
          <div ref={resultRef} className="space-y-3">

            {/* Screenshot + Score header */}
            <div
              className="glass rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border)' }}
            >
              {/* Browser chrome + screenshot */}
              <div className="overflow-hidden" style={{ background: '#0d0e1f' }}>
                {/* Browser top bar */}
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#13142a' }}>
                  <div className="flex gap-1.5 shrink-0">
                    <div className="size-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                    <div className="size-2.5 rounded-full" style={{ background: '#febc2e' }} />
                    <div className="size-2.5 rounded-full" style={{ background: '#28c840' }} />
                  </div>
                  <div className="flex flex-1 items-center gap-1.5 rounded-md px-2.5 py-1 min-w-0" style={{ background: '#0a0b1e', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="font-mono text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{result.url}</span>
                  </div>
                </div>
                {/* Screenshot */}
                <div className="relative w-full overflow-hidden" style={{ height: '220px', background: '#0a0b14' }}>
                  <img
                    src={result.raw.screenshotUrl}
                    alt={`Vista previa de ${result.domain}`}
                    className="w-full h-full object-cover object-top"
                    style={{ opacity: 0.92 }}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement
                      el.style.display = 'none'
                      const parent = el.parentElement
                      if (parent) {
                        const fb = parent.querySelector('[data-fallback]') as HTMLElement
                        if (fb) fb.style.display = 'flex'
                      }
                    }}
                  />
                  {/* Fallback */}
                  <div data-fallback="" className="absolute inset-0 items-center justify-center flex-col gap-1 hidden">
                    <Globe className="size-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Vista previa no disponible</span>
                  </div>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 55%, #0d0e1f 100%)' }} />
                </div>
              </div>

              <div className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-0.5 font-mono text-[11px] tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                    RESULTADO · {new Date(result.scanDate).toLocaleString('es-BO')}
                  </p>
                  <h3 className="text-xl font-bold text-white">{result.domain}</h3>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[12px]"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {result.url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="grid size-16 place-items-center rounded-2xl"
                    style={{ background: scoreColor(result.scores.overall) + '18', border: `2px solid ${scoreColor(result.scores.overall)}44` }}
                  >
                    <span className="text-2xl font-black" style={{ color: scoreColor(result.scores.overall) }}>
                      {result.scores.overall}
                    </span>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-white">Score global</p>
                    <p className="font-mono text-[11px]" style={{ color: scoreColor(result.scores.overall) }}>
                      {result.scores.overall >= 80 ? 'Bueno' : result.scores.overall >= 60 ? 'Regular' : result.scores.overall >= 40 ? 'Bajo' : 'Crítico'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 score rings */}
              <div className="flex flex-wrap justify-around gap-2">
                <ScoreRing score={result.scores.seo} label="SEO" />
                <ScoreRing score={result.scores.performance} label="PERF" />
                <ScoreRing score={result.scores.accessibility} label="A11Y" />
                <ScoreRing score={result.scores.conversion} label="CONV" />
              </div>

              {/* Quick signals */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  { label: 'HTTPS', ok: result.raw.isHttps },
                  { label: 'Title', ok: !!result.raw.title },
                  { label: 'Robots.txt', ok: result.raw.robotsTxtExists },
                  { label: 'Sitemap', ok: result.raw.sitemapExists },
                  { label: 'H1', ok: result.raw.h1s.length === 1 },
                  { label: 'Viewport', ok: result.raw.hasViewportMeta },
                  { label: 'Schema', ok: result.raw.hasSchema },
                  { label: 'Open Graph', ok: result.raw.hasOpenGraph },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: '#ffffff06', border: '1px solid var(--border)' }}
                  >
                    {s.ok
                      ? <CheckCircle2 size={13} className="shrink-0 text-green-400" />
                      : <XCircle size={13} className="shrink-0 text-red-400" />}
                    <span className="text-[12px] text-white">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Tech */}
              {result.tech.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.tech.map(t => (
                    <span
                      key={t.label}
                      className="rounded-full px-2.5 py-0.5 font-mono text-[11px]"
                      style={{
                        background: t.crit ? '#ef44440f' : '#ffffff0a',
                        border: `1px solid ${t.crit ? '#ef444433' : '#ffffff18'}`,
                        color: t.crit ? '#ef4444' : '#ffffff88',
                      }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}
              </div>{/* end inner p-5 */}
            </div>

            {/* Claude Enrichment */}
            {result.claudeEnrichment && (
              <div
                className="glass rounded-2xl p-5"
                style={{
                  border: '1px solid #00d4ff33',
                  background: 'linear-gradient(135deg, #00d4ff06 0%, #7C3AED06 100%)',
                }}
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} style={{ color: '#00d4ff' }} />
                    <span className="font-mono text-[11px] tracking-widest" style={{ color: '#00d4ff' }}>
                      ANÁLISIS INTELIGENTE · AUDITOR-X
                    </span>
                  </div>
                  {result.claudeEnrichment.dataConfidence && (
                    <span
                      className="font-mono text-[9px] tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: result.claudeEnrichment.dataConfidence === 'ALTA' ? '#22c55e18' : result.claudeEnrichment.dataConfidence === 'MEDIA' ? '#eab30818' : '#ef444418',
                        color: result.claudeEnrichment.dataConfidence === 'ALTA' ? '#22c55e' : result.claudeEnrichment.dataConfidence === 'MEDIA' ? '#eab308' : '#ef4444',
                        border: `1px solid ${result.claudeEnrichment.dataConfidence === 'ALTA' ? '#22c55e33' : result.claudeEnrichment.dataConfidence === 'MEDIA' ? '#eab30833' : '#ef444433'}`,
                      }}
                    >
                      CONFIANZA {result.claudeEnrichment.dataConfidence}
                    </span>
                  )}
                </div>

                {/* Executive Summary */}
                <p className="mb-3 text-[13px] leading-relaxed" style={{ color: '#e2e8f0cc' }}>
                  {result.claudeEnrichment.executiveSummary}
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Top Priority */}
                  <div className="rounded-xl p-3" style={{ background: '#ef444408', border: '1px solid #ef444422' }}>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Target size={11} className="text-red-400" />
                      <span className="font-mono text-[9px] tracking-wider text-red-400">PRIORIDAD MÁXIMA</span>
                    </div>
                    <p className="text-[12px] text-white">{result.claudeEnrichment.topPriority}</p>
                  </div>

                  {/* Strategic Note */}
                  <div className="rounded-xl p-3" style={{ background: '#7C3AED08', border: '1px solid #7C3AED22' }}>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <TrendingUp size={11} style={{ color: '#a78bfa' }} />
                      <span className="font-mono text-[9px] tracking-wider" style={{ color: '#a78bfa' }}>NOTA ESTRATÉGICA</span>
                    </div>
                    <p className="text-[12px] text-white">{result.claudeEnrichment.strategicNote}</p>
                  </div>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {/* Quick Wins */}
                  {result.claudeEnrichment.quickWins?.length > 0 && (
                    <div className="rounded-xl p-3" style={{ background: '#eab30808', border: '1px solid #eab30822' }}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Zap size={11} className="text-yellow-400" />
                        <span className="font-mono text-[9px] tracking-wider text-yellow-400">QUICK WINS</span>
                      </div>
                      <ul className="space-y-1">
                        {result.claudeEnrichment.quickWins.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#e2e8f0aa' }}>
                            <span className="mt-0.5 shrink-0 font-mono text-[9px] text-yellow-400">→</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Critical Issues */}
                  {result.claudeEnrichment.criticalIssues?.length > 0 && (
                    <div className="rounded-xl p-3" style={{ background: '#f9741608', border: '1px solid #f9741622' }}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <ShieldAlert size={11} className="text-orange-400" />
                        <span className="font-mono text-[9px] tracking-wider text-orange-400">PROBLEMAS CRÍTICOS</span>
                      </div>
                      <ul className="space-y-1">
                        {result.claudeEnrichment.criticalIssues.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: '#e2e8f0aa' }}>
                            <span className="mt-0.5 shrink-0 font-mono text-[9px] text-orange-400">!</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Findings P0/P1 */}
            {result.findings.length > 0 && (
              <div
                className="glass rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setShowFindings(v => !v)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <AlertTriangle size={15} className="text-orange-400" />
                    Hallazgos críticos
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                      style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444433' }}
                    >
                      {result.findings.length}
                    </span>
                  </span>
                  {showFindings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showFindings && (
                  <div className="space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                    {result.findings.map(f => (
                      <div key={f.id} className="p-5">
                        <div className="mb-2 flex flex-wrap items-start gap-2">
                          <PriorityBadge p={f.priority} />
                          <span
                            className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                            style={{ background: '#ffffff0a', color: '#ffffff55', border: '1px solid #ffffff14' }}
                          >
                            {f.module}
                          </span>
                          <p className="flex-1 font-medium text-white text-[13px]">{f.title}</p>
                        </div>
                        <p className="mb-2 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>{f.what}</p>
                        <p className="text-[12px] text-orange-300/80">{f.impactBusiness}</p>
                        {f.direction && (
                          <div
                            className="mt-3 rounded-lg px-3 py-2 text-[12px]"
                            style={{ background: '#7C3AED0a', border: '1px solid #7C3AED22', color: '#a78bfa' }}
                          >
                            <strong>Dirección:</strong> {f.direction}
                          </div>
                        )}
                        {f.evidence?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {f.evidence.map((ev, i) => (
                              <p key={i} className="font-mono text-[11px]" style={{ color: '#ffffff44' }}>
                                {ev.source}: <span style={{ color: '#ffffff66' }}>{ev.value}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Compact findings */}
            {result.compactFindings.length > 0 && (
              <div
                className="glass rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--border)' }}
              >
                <button
                  type="button"
                  onClick={() => setShowCompact(v => !v)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <Clock size={15} className="text-yellow-400" />
                    Oportunidades adicionales
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px]"
                      style={{ background: '#eab30822', color: '#eab308', border: '1px solid #eab30833' }}
                    >
                      {result.compactFindings.length}
                    </span>
                  </span>
                  {showCompact ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showCompact && (
                  <ul className="divide-y px-5 pb-4" style={{ borderColor: 'var(--border)' }}>
                    {result.compactFindings.map(f => (
                      <li key={f.id} className="flex flex-wrap items-start gap-2 py-3">
                        <PriorityBadge p={f.priority} />
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                          style={{ background: '#ffffff0a', color: '#ffffff44', border: '1px solid #ffffff0f' }}
                        >
                          {f.module}
                        </span>
                        <span className="flex-1 text-[13px] text-white">{f.title}</span>
                        <span className="shrink-0 font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                          {f.effort}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Raw signals */}
            <div
              className="glass rounded-2xl p-5"
              style={{ border: '1px solid var(--border)' }}
            >
              <p className="mb-4 font-mono text-[11px] tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
                SEÑALES CRUDAS
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[12px] sm:grid-cols-3">
                {[
                  ['TTFB', `${result.raw.ttfb}ms`],
                  ['Tiempo total', `${result.raw.totalTime}ms`],
                  ['HTTP Status', String(result.raw.statusCode)],
                  ['Palabras', String(result.raw.wordCount)],
                  ['Imágenes', `${result.raw.totalImages} (${result.raw.imagesWithoutAlt} sin alt)`],
                  ['Links internos', String(result.raw.internalLinks)],
                  ['Links externos', String(result.raw.externalLinks)],
                  ['H1 tags', String(result.raw.h1s.length)],
                  ['H2 tags', String(result.raw.h2s.length)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span style={{ color: 'var(--muted-foreground)' }}>{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}
