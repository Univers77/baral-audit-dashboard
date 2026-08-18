import { NextRequest, NextResponse } from 'next/server'
import { safeFetchBuffer, UnsafeUrlError } from '@/lib/security/safe-remote-fetch'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

// Una captura de Microlink ronda 1-2 MB. El límite deja margen amplio sin
// permitir que una respuesta enorme infle memoria: el base64 crece ~33% sobre
// el binario y además se serializa dentro de un JSON.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

/**
 * Convierte una imagen externa (capturas de Microlink, logo) en un data URI.
 * Existe porque html2canvas no puede leer píxeles de imágenes cross-origin sin
 * cabeceras CORS explícitas — el fetch server-side no tiene esa restricción.
 *
 * Al aceptar una URL del cliente, este endpoint comparte la misma superficie
 * SSRF que el escáner y usa exactamente el mismo gateway de salida.
 */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src')
  if (!src) {
    return NextResponse.json({ error: 'Falta el parámetro src' }, { status: 400 })
  }

  try {
    const res = await safeFetchBuffer(src, { timeoutMs: 20_000, maxBytes: MAX_IMAGE_BYTES })

    if (res.status < 200 || res.status >= 300) {
      return NextResponse.json({ error: `El origen respondió ${res.status}` }, { status: 502 })
    }
    if (!res.contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'El recurso solicitado no es una imagen' }, { status: 415 })
    }
    if (res.truncated) {
      return NextResponse.json({ error: 'La imagen supera el tamaño permitido' }, { status: 413 })
    }

    return NextResponse.json({
      dataUri: `data:${res.contentType};base64,${res.buffer.toString('base64')}`,
    })
  } catch (err: unknown) {
    if (err instanceof UnsafeUrlError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 })
    }
    // El detalle técnico se queda en logs; al cliente solo un mensaje genérico.
    console.error('[proxy-image]', err)
    return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 502 })
  }
}
