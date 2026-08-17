import { NextRequest, NextResponse } from 'next/server'
import { parsePsi } from '@/lib/psi/parse'
import type { Strategy } from '@/lib/psi/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Lighthouse tarda entre 15 y 40 s por estrategia; el default de Vercel no alcanza.
export const maxDuration = 60

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

/**
 * Caché en memoria del proceso. La cuota de PSI es el recurso escaso —sin clave
 * propia es una cuota global compartida entre todos los usuarios anónimos, y se
 * agota— así que se evita repetir la misma consulta.
 * No sobrevive a un cold start de la función, y no debe: 30 min basta para que
 * revisar el informe no cueste cuota extra.
 */
const TTL_MS = 30 * 60 * 1000
const cache = new Map<string, { at: number; data: unknown }>()

function cached(key: string) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > TTL_MS) { cache.delete(key); return null }
  return hit.data
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const strategy = (req.nextUrl.searchParams.get('strategy') ?? 'mobile') as Strategy

  if (!url) {
    return NextResponse.json({ error: 'Falta el parámetro url' }, { status: 400 })
  }
  if (strategy !== 'mobile' && strategy !== 'desktop') {
    return NextResponse.json({ error: 'strategy debe ser mobile o desktop' }, { status: 400 })
  }

  const key = `${strategy}::${url}`
  const hit = cached(key)
  if (hit) return NextResponse.json(hit, { headers: { 'X-Cache': 'HIT' } })

  const api = new URL(ENDPOINT)
  api.searchParams.set('url', url)
  api.searchParams.set('strategy', strategy)
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) {
    api.searchParams.append('category', c)
  }
  // Opcional: sin clave se usa la cuota anónima compartida, que se agota a diario.
  const apiKey = process.env.PAGESPEED_API_KEY
  if (apiKey) api.searchParams.set('key', apiKey)

  try {
    const res = await fetch(api, { signal: AbortSignal.timeout(55_000) })

    if (res.status === 429) {
      return NextResponse.json({
        error: 'Cuota de PageSpeed agotada',
        quotaExceeded: true,
        hint: apiKey
          ? 'La clave configurada superó su cuota diaria. Vuelve a intentarlo mañana o solicita más cuota en Google Cloud.'
          : 'No hay PAGESPEED_API_KEY configurada, así que se usa la cuota pública compartida de Google, que se agota a diario. Crear una clave gratuita en Google Cloud resuelve esto.',
      }, { status: 429 })
    }

    if (!res.ok) {
      let detail = ''
      try { detail = (await res.json())?.error?.message ?? '' } catch {}
      return NextResponse.json({
        error: detail || `PageSpeed respondió ${res.status}`,
        hint: res.status === 400
          ? 'Google no pudo cargar la URL. Suele ocurrir si el sitio bloquea rastreadores o exige autenticación.'
          : undefined,
      }, { status: res.status })
    }

    const parsed = parsePsi(await res.json(), strategy)
    cache.set(key, { at: Date.now(), data: parsed })
    return NextResponse.json(parsed, { headers: { 'X-Cache': 'MISS' } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const timedOut = /timeout|aborted/i.test(msg)
    return NextResponse.json({
      error: timedOut ? 'PageSpeed tardó demasiado en responder' : `Error al consultar PageSpeed: ${msg}`,
      hint: timedOut ? 'Los sitios pesados pueden superar el límite de análisis. Reintentar suele funcionar.' : undefined,
    }, { status: 504 })
  }
}
