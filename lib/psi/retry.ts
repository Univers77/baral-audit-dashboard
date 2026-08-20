/**
 * Política de reintentos para PageSpeed Insights.
 *
 * La API de Google falla de dos maneras muy distintas y conviene no tratarlas
 * igual. Unas se arreglan solas esperando —límite por minuto, saturación
 * momentánea, un corte de red— y otras no se van a arreglar por insistir, como
 * una URL mal formada o una clave sin permisos.
 *
 * Reintentar lo primero evita dejar al usuario con un error y un botón; volver
 * a intentar lo segundo solo alarga la espera para llegar al mismo sitio.
 *
 * Se separa de la interfaz para poder fijarla con tests: es una tabla de
 * decisiones, y una regresión aquí se traduce en una espera inútil de medio
 * minuto o en un fallo que se podía haber salvado.
 */

export interface PsiFailure {
  /** código HTTP de la respuesta, si llegó a haberla */
  status?: number
  /** la API declaró cuota agotada */
  quota?: boolean
  /** no hubo respuesta: corte de red o plazo agotado */
  network?: boolean
}

export interface RetryDecision {
  retry: boolean
  delayMs: number
  /** qué contarle al usuario mientras espera */
  reason: string
}

/** Intentos totales, incluido el primero. */
export const MAX_ATTEMPTS = 3

/** Espera antes del intento n+1. Creciente para no golpear un servicio saturado. */
const BACKOFF_MS = [2_000, 6_000]

const NO_RETRY: RetryDecision = { retry: false, delayMs: 0, reason: '' }

/**
 * @param attempt número del intento que acaba de fallar, empezando en 1
 */
export function decideRetry(attempt: number, failure: PsiFailure): RetryDecision {
  if (attempt >= MAX_ATTEMPTS) return NO_RETRY

  const delayMs = BACKOFF_MS[attempt - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1]

  // Sin respuesta: casi siempre es un corte momentáneo o un plazo agotado.
  if (failure.network) {
    return { retry: true, delayMs, reason: 'Sin respuesta de Google. Reintentando…' }
  }

  const status = failure.status ?? 0

  // 429 puede ser el límite por minuto —que se recupera— o la cuota diaria.
  // Se reintenta una vez: si es lo segundo, el segundo fallo lo confirma sin
  // hacer perder mucho tiempo.
  if (status === 429 || failure.quota) {
    return attempt === 1
      ? { retry: true, delayMs: 6_000, reason: 'Google está limitando las consultas. Reintentando…' }
      : NO_RETRY
  }

  // La API de Google devuelve 500 y 503 con bastante frecuencia en picos.
  if (status >= 500) {
    return { retry: true, delayMs, reason: 'Google devolvió un error temporal. Reintentando…' }
  }

  // 400 (URL inválida), 403 (clave sin permisos) y demás no mejoran esperando.
  return NO_RETRY
}

/** Mensaje para el intento en curso, cuando hay más de uno. */
export function attemptLabel(attempt: number): string {
  return attempt === 1 ? 'Consultando PageSpeed…' : `Reintento ${attempt} de ${MAX_ATTEMPTS}…`
}
