import { NextRequest } from 'next/server'
import { fetchAndScan } from '@/lib/scanner/fetcher'
import { analyze } from '@/lib/scanner/analyzer'
import { saveResult } from '@/lib/scanner/writer'
import { enrichWithClaude } from '@/lib/scanner/claude-analyzer'
import type { ScanError } from '@/lib/scanner/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function send(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(line))
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return new Response('URL requerida', { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      // retry:0 deshabilita la reconexión automática del EventSource en el browser
      controller.enqueue(new TextEncoder().encode('retry: 0\n\n'))
      try {
        send(controller, 'progress', { step: 1, total: 4, message: 'Conectando con el sitio...', pct: 10 })

        const rawOrError = await fetchAndScan(url)

        if ('error' in rawOrError) {
          const err = rawOrError as ScanError
          send(controller, 'error', { message: `No se pudo alcanzar el sitio: ${err.error}` })
          controller.close()
          return
        }

        const raw = rawOrError
        send(controller, 'progress', { step: 2, total: 4, message: `Sitio alcanzado — ${raw.statusCode} (${raw.ttfb}ms TTFB)`, pct: 40 })

        send(controller, 'progress', { step: 3, total: 5, message: 'Aplicando heurísticas AUDITOR-X...', pct: 55 })
        const result = analyze(raw)

        send(controller, 'progress', { step: 4, total: 5, message: 'Consultando cerebro AUDITOR-X (Claude Haiku)...', pct: 75 })
        try {
          const enrichment = await enrichWithClaude(result, raw)
          if (enrichment) result.claudeEnrichment = enrichment
        } catch {
          // Graceful degradation — scanner funciona sin enrichment
        }

        // Enviar resultado al cliente antes de intentar guardar en disco
        send(controller, 'result', result)
        send(controller, 'done', { message: 'Análisis completado' })

        // Guardar en disco de forma non-blocking — falla silenciosa en Vercel
        try {
          send(controller, 'progress', { step: 5, total: 5, message: 'Guardando resultados...', pct: 90 })
          saveResult(result)
        } catch {
          // En Vercel el filesystem de solo lectura impide guardar — ignorar
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        send(controller, 'error', { message: `Error interno: ${msg}` })
      } finally {
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
