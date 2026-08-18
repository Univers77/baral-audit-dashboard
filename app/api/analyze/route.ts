import { NextRequest } from 'next/server'
import { fetchAndScan } from '@/lib/scanner/fetcher'
import { analyze } from '@/lib/scanner/analyzer'
import { recordScanEvent, saveResult } from '@/lib/scanner/writer'
import { enrichWithClaude } from '@/lib/scanner/claude-analyzer'
import { log, newRequestId, safeDomain, type ErrorCode } from '@/lib/observability/log'
import type { ScanError } from '@/lib/scanner/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function send(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(line))
}

/** Traduce el mensaje del escáner a un código estable de la taxonomía. */
function classifyScanError(message: string): ErrorCode {
  if (/red privada o reservada|Protocolo no permitido|credenciales embebidas/i.test(message)) {
    return 'AUDIT_BLOCKED_DESTINATION'
  }
  if (/URL inválida|no resolvió|resolver el host/i.test(message)) return 'AUDIT_INVALID_URL'
  if (/timeout|abort|tardó/i.test(message)) return 'AUDIT_TIMEOUT'
  return 'AUDIT_REMOTE_UNREACHABLE'
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return new Response('URL requerida', { status: 400 })
  }

  const TOTAL_STEPS = 5
  const requestId = newRequestId()
  const domain = safeDomain(url.startsWith('http') ? url : `https://${url}`)
  const startedAt = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      // retry:0 deshabilita la reconexión automática del EventSource en el browser
      controller.enqueue(new TextEncoder().encode('retry: 0\n\n'))
      log.info('scan.start', { requestId, route: '/api/analyze', domain })

      try {
        send(controller, 'progress', { step: 1, total: TOTAL_STEPS, message: 'Conectando con el sitio...', pct: 10 })

        const rawOrError = await fetchAndScan(url)

        if ('error' in rawOrError) {
          const err = rawOrError as ScanError
          const code = classifyScanError(err.error)
          const durationMs = Date.now() - startedAt

          log.warn('scan.failed', { requestId, route: '/api/analyze', domain, durationMs, code, detail: err.error })
          recordScanEvent({
            ts: new Date().toISOString(),
            domain, url, outcome: 'error', durationMs, code, message: err.error,
          })

          send(controller, 'error', { message: `No se pudo alcanzar el sitio: ${err.error}`, code })
          return
        }

        const raw = rawOrError
        send(controller, 'progress', { step: 2, total: TOTAL_STEPS, message: `Sitio alcanzado — ${raw.statusCode} (${raw.ttfb}ms TTFB)`, pct: 40 })

        send(controller, 'progress', { step: 3, total: TOTAL_STEPS, message: 'Aplicando heurísticas AUDITOR-X...', pct: 55 })
        const result = analyze(raw)

        send(controller, 'progress', { step: 4, total: TOTAL_STEPS, message: 'Consultando cerebro AUDITOR-X (Claude Haiku)...', pct: 75 })
        try {
          const enrichment = await enrichWithClaude(result, raw)
          if (enrichment) result.claudeEnrichment = enrichment
          else log.warn('claude.no_enrichment', { requestId, domain, code: 'CLAUDE_INVALID_OUTPUT' })
        } catch (err: unknown) {
          // El informe determinístico sigue siendo válido sin el bloque de IA.
          log.warn('claude.failed', {
            requestId, domain, code: 'CLAUDE_FAILURE',
            detail: err instanceof Error ? err.message : String(err),
          })
        }

        // El guardado va antes de result/done: enviar progreso después de
        // anunciar el cierre dejaba eventos huérfanos que el cliente ya no lee.
        send(controller, 'progress', { step: 5, total: TOTAL_STEPS, message: 'Guardando resultados...', pct: 90 })
        try {
          saveResult(result)
        } catch (err: unknown) {
          // En Vercel el filesystem de solo lectura impide guardar — no es fatal.
          log.warn('persist.failed', {
            requestId, domain, code: 'PERSIST_FAILED',
            detail: err instanceof Error ? err.message : String(err),
          })
        }

        const durationMs = Date.now() - startedAt
        log.info('scan.ok', {
          requestId, route: '/api/analyze', domain, durationMs,
          status: raw.statusCode, overall: result.scores.overall, findings: result.findings.length,
        })
        recordScanEvent({
          ts: new Date().toISOString(),
          domain, url, outcome: 'ok', durationMs,
          overall: result.scores.overall,
          findings: result.findings.length + result.compactFindings.length,
          statusCode: raw.statusCode,
        })

        send(controller, 'result', result)
        send(controller, 'done', { message: 'Análisis completado' })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        const durationMs = Date.now() - startedAt

        log.error('scan.crashed', { requestId, route: '/api/analyze', domain, durationMs, code: 'AUDIT_INTERNAL', detail: msg })
        recordScanEvent({
          ts: new Date().toISOString(),
          domain, url, outcome: 'error', durationMs, code: 'AUDIT_INTERNAL', message: msg,
        })

        send(controller, 'error', { message: `Error interno: ${msg}`, code: 'AUDIT_INTERNAL' })
      } finally {
        // Único punto de cierre: cerrar dos veces lanza TypeError.
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
