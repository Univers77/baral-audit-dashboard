/**
 * PageSpeed Insights v5 = dos fuentes distintas en una sola respuesta:
 *
 *  · CrUX (campo)      — usuarios reales de Chrome, últimos 28 días. Es lo que
 *                        Google usa como señal de ranking. Solo existe si el
 *                        sitio tiene tráfico suficiente para ser estadístico.
 *  · Lighthouse (lab)  — simulación controlada en un dispositivo emulado.
 *                        Siempre disponible, pero no es lo que mide Google
 *                        para ranking.
 *
 * Mezclarlas sin distinguirlas es el error más común al leer PSI.
 */

export type Strategy = 'mobile' | 'desktop'

/** Categoría de Core Web Vitals según los umbrales oficiales de Google. */
export type CwvVerdict = 'bueno' | 'mejorable' | 'deficiente' | 'sin-datos'

export interface CwvMetric {
  key: string
  label: string
  /** valor en el percentil 75 de usuarios reales */
  percentile: number
  unit: 'ms' | 's' | 'score'
  verdict: CwvVerdict
  /** reparto de usuarios: bueno / mejorable / deficiente (0–1) */
  distribution: [number, number, number]
  good: number
  poor: number
  isCoreWebVital: boolean
  what: string
}

export interface FieldData {
  available: boolean
  /** true si los datos son del origen completo y no de esta URL exacta */
  fromOrigin: boolean
  overall: CwvVerdict
  metrics: CwvMetric[]
}

export interface LabMetric {
  key: string
  label: string
  display: string
  numericValue: number
  score: number | null
  what: string
}

export interface Opportunity {
  key: string
  title: string
  description: string
  savingsMs: number
  savingsBytes: number
  score: number | null
}

export interface FailedAudit {
  key: string
  title: string
  description: string
  displayValue: string
  score: number
  category: string
}

/** Fotograma de la tira de progreso de carga (filmstrip) que genera Lighthouse. */
export interface FilmstripFrame {
  /** milisegundos desde el inicio de la navegación */
  timing: number
  /** data URI (image/jpeg;base64) lista para usar en <img src> */
  data: string
}

export interface PsiCategoryScores {
  performance: number | null
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
}

export interface PsiResult {
  url: string
  finalUrl: string
  strategy: Strategy
  fetchedAt: string
  lighthouseVersion: string
  scores: PsiCategoryScores
  field: FieldData
  lab: LabMetric[]
  opportunities: Opportunity[]
  failedAudits: FailedAudit[]
  /** peso total transferido, en bytes */
  totalBytes: number
  warnings: string[]
  /** tira de miniaturas del progreso de carga, en orden cronológico */
  filmstrip: FilmstripFrame[]
  /** captura final de la página ya cargada, si Lighthouse la generó */
  finalScreenshot: string | null
}

export interface PsiError {
  error: string
  /** true cuando es 429: cuota agotada, no un fallo del sitio */
  quotaExceeded?: boolean
  hint?: string
}

export type PsiResponse = PsiResult | PsiError

export function isPsiError(r: PsiResponse): r is PsiError {
  return 'error' in r
}
