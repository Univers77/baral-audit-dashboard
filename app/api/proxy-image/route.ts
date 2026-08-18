import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * Convierte una imagen externa (capturas de Microlink, logo, etc.) en un data URI.
 * Existe porque html2canvas no puede leer píxeles de imágenes cross-origin sin
 * cabeceras CORS explícitas — el fetch server-side no tiene esa restricción.
 */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src')
  if (!src) {
    return NextResponse.json({ error: 'Falta el parámetro src' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(src)
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'Protocolo no permitido' }, { status: 400 })
  }

  try {
    const res = await fetch(parsed, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) {
      return NextResponse.json({ error: `Origen respondió ${res.status}` }, { status: 502 })
    }
    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    return NextResponse.json({
      dataUri: `data:${contentType};base64,${buf.toString('base64')}`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `No se pudo obtener la imagen: ${msg}` }, { status: 502 })
  }
}
