import type { AuditResult } from '@/lib/scanner/types'

/**
 * Umbrales objetivos y publicados. No son opiniones ni estimaciones nuestras:
 * cada uno tiene fuente citable. Esto permite comparar cualquier sitio sin
 * depender de que existan competidores cargados.
 */

export type Verdict = 'bueno' | 'mejorable' | 'deficiente'

export interface Metric {
  key: string
  label: string
  /** valor medido del sitio */
  value: number
  /** cómo se muestra */
  format: (v: number) => string
  /** umbral de "bueno" */
  good: number
  /** umbral de "mejorable"; peor que esto es deficiente */
  fair: number
  /** true si un valor menor es mejor (TTFB, imágenes sin alt…) */
  lowerIsBetter: boolean
  source: string
  why: string
}

function verdictFor(m: Metric): Verdict {
  if (m.lowerIsBetter) {
    if (m.value <= m.good) return 'bueno'
    if (m.value <= m.fair) return 'mejorable'
    return 'deficiente'
  }
  if (m.value >= m.good) return 'bueno'
  if (m.value >= m.fair) return 'mejorable'
  return 'deficiente'
}

export function metricsFor(r: AuditResult): (Metric & { verdict: Verdict })[] {
  const raw = r.raw
  const altPct = raw.totalImages > 0
    ? Math.round((raw.imagesWithoutAlt / raw.totalImages) * 100)
    : 0

  const list: Metric[] = [
    {
      key: 'ttfb',
      label: 'Respuesta del servidor',
      value: raw.ttfb,
      format: v => `${v} ms`,
      good: 800, fair: 1800, lowerIsBetter: true,
      source: 'Google · Core Web Vitals',
      why: 'Es el tiempo hasta el primer byte. Todo lo demás de la carga ocurre después, así que marca el techo de velocidad del sitio.',
    },
    {
      key: 'title',
      label: 'Longitud del título',
      value: raw.titleLen,
      format: v => `${v} caracteres`,
      good: 50, fair: 30, lowerIsBetter: false,
      source: 'Google Search Central',
      why: 'Entre 50 y 60 caracteres el título se muestra completo en resultados. Más corto desaprovecha espacio; más largo se corta.',
    },
    {
      key: 'meta',
      label: 'Meta descripción',
      value: raw.metaDescLen,
      format: v => (v === 0 ? 'ausente' : `${v} caracteres`),
      good: 160, fair: 320, lowerIsBetter: true,
      source: 'Google Search Central',
      why: 'Google corta alrededor de los 160 caracteres. Si se pasa, el mensaje principal puede quedar fuera del resultado.',
    },
    {
      key: 'alt',
      label: 'Imágenes sin texto alternativo',
      value: altPct,
      format: v => `${v}%`,
      good: 5, fair: 25, lowerIsBetter: true,
      source: 'WCAG 2.2 · criterio 1.1.1 (nivel A)',
      why: 'Una imagen sin alt no existe para quien usa lector de pantalla, y Google tampoco la puede indexar.',
    },
    {
      key: 'content',
      label: 'Volumen de contenido',
      value: raw.wordCount,
      format: v => `${v.toLocaleString('es-BO')} palabras`,
      good: 800, fair: 300, lowerIsBetter: false,
      source: 'Referencia de industria',
      why: 'Por debajo de 300 palabras Google suele tratar la página como contenido delgado y le cuesta asignarle autoridad temática.',
    },
    {
      key: 'internal',
      label: 'Enlaces internos',
      value: raw.internalLinks,
      format: v => `${v}`,
      good: 15, fair: 6, lowerIsBetter: false,
      source: 'Referencia de industria',
      why: 'Los enlaces internos reparten autoridad entre páginas y permiten que el rastreador recorra el sitio completo.',
    },
  ]

  return list.map(m => ({ ...m, verdict: verdictFor(m) }))
}

/** Puntaje 0–100 de cumplimiento contra los umbrales objetivos. */
export function benchmarkScore(r: AuditResult): number {
  const ms = metricsFor(r)
  if (!ms.length) return 0
  const pts = ms.reduce((a, m) => a + (m.verdict === 'bueno' ? 100 : m.verdict === 'mejorable' ? 55 : 15), 0)
  return Math.round(pts / ms.length)
}

export const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  bueno:      { label: 'CUMPLE',    color: 'var(--nova)' },
  mejorable:  { label: 'MEJORABLE', color: 'var(--solar)' },
  deficiente: { label: 'NO CUMPLE', color: 'var(--pulsar)' },
}

// ── Competidores escaneados en vivo ─────────────────────────────────────────

export interface Competitor {
  url: string
  domain: string
  status: 'pendiente' | 'escaneando' | 'listo' | 'error'
  result?: AuditResult
  error?: string
}

/** Extrae las métricas comparables de un resultado ya escaneado. */
export function comparableRow(r: AuditResult) {
  const altPct = r.raw.totalImages > 0
    ? Math.round((r.raw.imagesWithoutAlt / r.raw.totalImages) * 100)
    : 0
  return {
    overall: r.scores.overall,
    seo: r.scores.seo,
    performance: r.scores.performance,
    accessibility: r.scores.accessibility,
    conversion: r.scores.conversion,
    ttfb: r.raw.ttfb,
    words: r.raw.wordCount,
    altPct,
    internalLinks: r.raw.internalLinks,
    schema: r.raw.hasSchema,
  }
}

export type ComparableKey = keyof ReturnType<typeof comparableRow>

export const COMPARABLE_LABELS: { key: ComparableKey; label: string; lowerIsBetter?: boolean; fmt: (v: number | boolean) => string }[] = [
  { key: 'overall',       label: 'Score global',        fmt: v => String(v) },
  { key: 'seo',           label: 'SEO',                 fmt: v => String(v) },
  { key: 'performance',   label: 'Rendimiento',         fmt: v => String(v) },
  { key: 'accessibility', label: 'Accesibilidad',       fmt: v => String(v) },
  { key: 'conversion',    label: 'Conversión',          fmt: v => String(v) },
  { key: 'ttfb',          label: 'Respuesta servidor',  lowerIsBetter: true, fmt: v => `${v} ms` },
  { key: 'words',         label: 'Contenido',           fmt: v => `${Number(v).toLocaleString('es-BO')} pal.` },
  { key: 'altPct',        label: 'Imágenes sin alt',    lowerIsBetter: true, fmt: v => `${v}%` },
  { key: 'internalLinks', label: 'Enlaces internos',    fmt: v => String(v) },
  { key: 'schema',        label: 'Schema estructurado', fmt: v => (v ? 'Sí' : 'No') },
]
