/**
 * Restauración del último escaneo desde el navegador.
 *
 * Lo guardado por una versión anterior de la aplicación es entrada no
 * confiable: le faltan campos que el render actual da por hechos. Un resultado
 * viejo en el sessionStorage de un visitante tumbaba la página entera al
 * cargar, y el visitante no tenía forma de saber por qué.
 *
 * Dos componentes distintos leían esta clave por su cuenta. Validar en un solo
 * sitio evita que la próxima ampliación del modelo vuelva a romper solo uno
 * de los dos.
 */

import type { AuditResult } from './types'

export const LAST_RESULT_KEY = 'auditorx-last-result'

/**
 * ¿El resultado guardado tiene la forma que este render espera?
 *
 * Comprueba los campos añadidos después de la primera publicación. Al ampliar
 * `AuditResult` con algo que la interfaz consuma sin protección, añadirlo aquí.
 */
export function isCurrentShape(value: unknown): value is AuditResult {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.domain === 'string' &&
    typeof o.url === 'string' &&
    !!o.scores &&
    !!o.raw &&
    Array.isArray(o.findings) &&
    Array.isArray(o.compactFindings) &&
    !!o.agentReadiness &&
    Array.isArray((o.coverage as { pillars?: unknown } | undefined)?.pillars)
  )
}

/**
 * Devuelve el último resultado si sigue siendo utilizable, y descarta el dato
 * cuando no lo es para que el problema no se repita en la siguiente carga.
 */
export function restoreLastResult(): AuditResult | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = window.sessionStorage.getItem(LAST_RESULT_KEY)
    if (!saved) return null
    const parsed: unknown = JSON.parse(saved)
    if (isCurrentShape(parsed)) return parsed
    window.sessionStorage.removeItem(LAST_RESULT_KEY)
    return null
  } catch {
    try { window.sessionStorage.removeItem(LAST_RESULT_KEY) } catch {}
    return null
  }
}
