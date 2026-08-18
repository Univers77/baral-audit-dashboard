import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { EVENTS_FILE } from '@/lib/scanner/paths'
import type { ScanEvent } from '@/lib/scanner/writer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000

/**
 * Bitácora de diagnóstico: qué se intentó auditar y cómo terminó.
 *
 * Existe porque el JSON por dominio solo conserva el último escaneo correcto —
 * los fallos no dejaban rastro y las regresiones eran invisibles. Aquí se puede
 * ver la serie completa de intentos y el recuento de errores por tipo.
 *
 * Parámetros: `limit` (máx. 1000), `domain` y `outcome` (ok | error).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = Math.min(Number(searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT)
  const domainFilter = searchParams.get('domain')
  const outcomeFilter = searchParams.get('outcome')

  if (!fs.existsSync(EVENTS_FILE)) {
    return NextResponse.json({ events: [], summary: emptySummary() })
  }

  let events: ScanEvent[]
  try {
    events = fs.readFileSync(EVENTS_FILE, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line) as ScanEvent } catch { return null } })
      .filter((e): e is ScanEvent => e !== null)
  } catch {
    return NextResponse.json({ events: [], summary: emptySummary() })
  }

  // El resumen se calcula sobre todo el historial; los filtros solo recortan
  // la lista devuelta, para que el recuento de fallos no dependa de la vista.
  const summary = summarize(events)

  let filtered = events
  if (domainFilter) filtered = filtered.filter(e => e.domain === domainFilter)
  if (outcomeFilter === 'ok' || outcomeFilter === 'error') {
    filtered = filtered.filter(e => e.outcome === outcomeFilter)
  }

  // Más recientes primero.
  const recent = filtered.slice(-limit).reverse()

  return NextResponse.json({ events: recent, summary })
}

function emptySummary() {
  return { total: 0, ok: 0, error: 0, errorRate: 0, byCode: {}, avgDurationMs: 0, domains: 0 }
}

function summarize(events: ScanEvent[]) {
  const ok = events.filter(e => e.outcome === 'ok')
  const failed = events.filter(e => e.outcome === 'error')

  const byCode: Record<string, number> = {}
  for (const e of failed) {
    const key = e.code ?? 'SIN_CODIGO'
    byCode[key] = (byCode[key] ?? 0) + 1
  }

  const avgDurationMs = ok.length > 0
    ? Math.round(ok.reduce((s, e) => s + (e.durationMs ?? 0), 0) / ok.length)
    : 0

  return {
    total: events.length,
    ok: ok.length,
    error: failed.length,
    errorRate: events.length > 0 ? Math.round((failed.length / events.length) * 100) : 0,
    byCode,
    avgDurationMs,
    domains: new Set(events.map(e => e.domain)).size,
  }
}
