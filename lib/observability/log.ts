/**
 * Registro estructurado de eventos.
 *
 * Esta aplicación es una herramienta interna de diagnóstico: su valor depende
 * de poder responder "¿qué falló, cuándo y por qué?". Un `console.error` suelto
 * no sirve para eso. Cada evento sale como una única línea JSON, de modo que
 * pueda filtrarse con grep tanto en la terminal local como en los logs de Vercel.
 *
 * Regla estricta: aquí nunca entra un token, una clave ni una cabecera
 * Authorization. Si un dato pudiera contener credenciales, no se registra.
 */

/** Taxonomía cerrada de errores: permite contarlos y compararlos entre ejecuciones. */
export type ErrorCode =
  // Escaneo
  | 'AUDIT_INVALID_URL'
  | 'AUDIT_BLOCKED_DESTINATION'
  | 'AUDIT_TIMEOUT'
  | 'AUDIT_REMOTE_UNREACHABLE'
  | 'AUDIT_INTERNAL'
  // PageSpeed Insights
  | 'PSI_QUOTA'
  | 'PSI_TIMEOUT'
  | 'PSI_BAD_REQUEST'
  | 'PSI_ERROR'
  // Enriquecimiento con IA
  | 'CLAUDE_FAILURE'
  | 'CLAUDE_INVALID_OUTPUT'
  // Google Analytics
  | 'GA4_AUTH'
  | 'GA4_FORBIDDEN'
  | 'GA4_TIMEOUT'
  | 'GA4_ERROR'
  // Proxy de imágenes
  | 'PROXY_BLOCKED'
  | 'PROXY_TOO_LARGE'
  | 'PROXY_ERROR'
  // Persistencia
  | 'PERSIST_FAILED'

export interface LogFields {
  /** correlaciona todos los eventos de una misma petición */
  requestId?: string
  route?: string
  /** dominio auditado — nunca la URL completa, que puede llevar tokens en la query */
  domain?: string
  durationMs?: number
  code?: ErrorCode
  status?: number
  [key: string]: unknown
}

type Level = 'info' | 'warn' | 'error'

function emit(level: Level, event: string, fields: LogFields = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const log = {
  info: (event: string, fields?: LogFields) => emit('info', event, fields),
  warn: (event: string, fields?: LogFields) => emit('warn', event, fields),
  error: (event: string, fields?: LogFields) => emit('error', event, fields),
}

/** Identificador corto para correlacionar los eventos de una petición. */
export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Extrae el dominio de una URL para registrarlo sin arrastrar la query string,
 * donde podrían viajar tokens del sitio auditado.
 */
export function safeDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return 'url-invalida'
  }
}
