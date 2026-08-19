/**
 * Comprobación de enlaces rotos.
 *
 * El campo `brokenLinks` existía en el modelo desde el principio y siempre
 * llegaba vacío: nadie lo llenaba. El informe declaraba implícitamente que no
 * había enlaces rotos sin haber comprobado ninguno.
 *
 * El criterio aquí es conservador a propósito. Un escáner que marca como roto
 * todo lo que no responde produce listas llenas de falsos positivos —muchos
 * sitios rechazan peticiones automatizadas— y el cliente deja de creer en el
 * informe entero. Solo se afirma «roto» cuando el servidor lo dice.
 */

import { safeFetchStatus } from '@/lib/security/safe-remote-fetch'

export type LinkVerdict = 'ok' | 'roto' | 'restringido' | 'sin-respuesta'

export interface LinkCheck {
  url: string
  kind: 'internal' | 'external'
  status: number | null
  verdict: LinkVerdict
  reason: string
}

/** Cuántos enlaces se comprueban como máximo: acota el tiempo del escaneo. */
export const MAX_LINKS_CHECKED = 20
/** Peticiones simultáneas. */
const CONCURRENCY = 6
const TIMEOUT_MS = 6_000

/**
 * Traduce un código de estado a veredicto.
 *
 * Separado de la red para poder fijarlo con tests: es donde viven los falsos
 * positivos y donde una regresión pasaría inadvertida.
 */
export function verdictForStatus(status: number | null): { verdict: LinkVerdict; reason: string } {
  if (status === null) {
    return {
      verdict: 'sin-respuesta',
      reason: 'No hubo respuesta. Puede ser un servidor caído o un destino que rechaza peticiones automatizadas.',
    }
  }
  if (status >= 200 && status < 400) {
    return { verdict: 'ok', reason: `Responde ${status}` }
  }
  if (status === 404 || status === 410) {
    return { verdict: 'roto', reason: `El servidor responde ${status}: el recurso no existe` }
  }
  if (status >= 500) {
    return { verdict: 'roto', reason: `El servidor responde ${status}: error del servidor de destino` }
  }
  // 401, 403, 429 y demás: el recurso existe, solo no nos lo entrega a
  // nosotros. Marcarlos como rotos sería el error más común de estos escáneres.
  return {
    verdict: 'restringido',
    reason: `Responde ${status}: el destino existe pero restringe el acceso automatizado`,
  }
}

/** Ejecuta tareas con un límite de simultaneidad, preservando el orden de entrada. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0

  async function worker() {
    while (true) {
      const i = next++
      if (i >= items.length) return
      out[i] = await fn(items[i])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

export interface LinkTarget {
  url: string
  kind: 'internal' | 'external'
}

/**
 * Comprueba una muestra acotada de enlaces.
 *
 * Todo el tráfico sale por el gateway, así que un enlace que apunte a una red
 * privada se bloquea igual que en el resto del escáner.
 */
export async function checkLinks(
  targets: LinkTarget[],
  opts: { limit?: number; timeoutMs?: number } = {},
): Promise<LinkCheck[]> {
  const limit = opts.limit ?? MAX_LINKS_CHECKED
  const sample = targets.slice(0, limit)
  if (sample.length === 0) return []

  return mapLimit(sample, CONCURRENCY, async t => {
    const status = await safeFetchStatus(t.url, { timeoutMs: opts.timeoutMs ?? TIMEOUT_MS })
    const { verdict, reason } = verdictForStatus(status)
    return { url: t.url, kind: t.kind, status, verdict, reason }
  })
}

/** Solo los confirmados por el servidor de destino. */
export function confirmedBroken(checks: LinkCheck[]): LinkCheck[] {
  return checks.filter(c => c.verdict === 'roto')
}
