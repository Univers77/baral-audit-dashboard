import type {
  CwvMetric, CwvVerdict, FailedAudit, FieldData, LabMetric,
  Opportunity, PsiResult, Strategy,
} from './types'

/**
 * Umbrales oficiales de Core Web Vitals (web.dev/vitals).
 * good = límite superior de "bueno"; poor = a partir de aquí es deficiente.
 */
const CWV_DEF: Record<string, {
  label: string; good: number; poor: number; unit: 'ms' | 's' | 'score'
  core: boolean; what: string
}> = {
  LARGEST_CONTENTFUL_PAINT_MS: {
    label: 'LCP · Carga del contenido principal',
    good: 2500, poor: 4000, unit: 'ms', core: true,
    what: 'Cuánto tarda en aparecer el elemento más grande de la pantalla. Es la medida de "¿ya cargó?" desde la perspectiva del visitante.',
  },
  INTERACTION_TO_NEXT_PAINT: {
    label: 'INP · Respuesta a la interacción',
    good: 200, poor: 500, unit: 'ms', core: true,
    what: 'Cuánto tarda la página en reaccionar cuando alguien toca o hace clic. Sustituyó a FID como métrica oficial en marzo de 2024.',
  },
  CUMULATIVE_LAYOUT_SHIFT_SCORE: {
    label: 'CLS · Estabilidad visual',
    good: 0.1, poor: 0.25, unit: 'score', core: true,
    what: 'Cuánto se mueve el contenido mientras carga. Es la causa de que uno intente tocar un botón y termine tocando otro.',
  },
  FIRST_CONTENTFUL_PAINT_MS: {
    label: 'FCP · Primer contenido visible',
    good: 1800, poor: 3000, unit: 'ms', core: false,
    what: 'Cuándo aparece el primer texto o imagen. Marca el momento en que el visitante deja de ver una pantalla en blanco.',
  },
  EXPERIMENTAL_TIME_TO_FIRST_BYTE: {
    label: 'TTFB · Respuesta del servidor',
    good: 800, poor: 1800, unit: 'ms', core: false,
    what: 'Cuánto tarda el servidor en responder. Es el techo de todo lo demás: nada puede cargar antes que esto.',
  },
}

/** CrUX ya clasifica, pero se recalcula para no depender de su etiqueta. */
function verdictFor(v: number, good: number, poor: number): CwvVerdict {
  if (v <= good) return 'bueno'
  if (v <= poor) return 'mejorable'
  return 'deficiente'
}

function parseField(le: any, ol: any): FieldData {
  // Se prefiere la URL exacta; si no tiene tráfico suficiente, CrUX solo
  // devuelve datos agregados del origen y hay que decirlo explícitamente.
  const src = le?.metrics ? le : ol?.metrics ? ol : null
  if (!src) {
    return { available: false, fromOrigin: false, overall: 'sin-datos', metrics: [] }
  }

  const metrics: CwvMetric[] = []
  for (const [key, def] of Object.entries(CWV_DEF)) {
    const m = src.metrics[key]
    if (!m || typeof m.percentile !== 'number') continue

    const raw = m.percentile
    // CLS llega multiplicado por 100 (8 significa 0.08)
    const value = def.unit === 'score' ? raw / 100 : raw
    const dist = (m.distributions ?? []).map((d: any) => d.proportion ?? 0)

    metrics.push({
      key,
      label: def.label,
      percentile: value,
      unit: def.unit,
      verdict: verdictFor(value, def.good, def.poor),
      distribution: [dist[0] ?? 0, dist[1] ?? 0, dist[2] ?? 0],
      good: def.good,
      poor: def.poor,
      isCoreWebVital: def.core,
      what: def.what,
    })
  }

  // El veredicto global lo determinan solo las tres Core Web Vitals.
  const core = metrics.filter(m => m.isCoreWebVital)
  const overall: CwvVerdict = core.length === 0
    ? 'sin-datos'
    : core.some(m => m.verdict === 'deficiente') ? 'deficiente'
    : core.some(m => m.verdict === 'mejorable') ? 'mejorable'
    : 'bueno'

  return { available: true, fromOrigin: !le?.metrics, overall, metrics }
}

const LAB_DEF: Record<string, { label: string; what: string }> = {
  'first-contentful-paint':    { label: 'Primer contenido', what: 'Cuándo aparece el primer texto o imagen en pantalla.' },
  'largest-contentful-paint':  { label: 'Contenido principal', what: 'Cuándo termina de mostrarse el elemento más grande.' },
  'total-blocking-time':       { label: 'Tiempo bloqueado', what: 'Cuánto tiempo el navegador queda ocupado y no responde a clics.' },
  'cumulative-layout-shift':   { label: 'Desplazamiento visual', what: 'Cuánto salta el contenido durante la carga.' },
  'speed-index':               { label: 'Índice de velocidad', what: 'Qué tan rápido se completa visualmente la pantalla.' },
  'server-response-time':      { label: 'Respuesta del servidor', what: 'Tiempo hasta el primer byte, medido en laboratorio.' },
}

function parseLab(audits: Record<string, any>): LabMetric[] {
  const out: LabMetric[] = []
  for (const [key, def] of Object.entries(LAB_DEF)) {
    const a = audits[key]
    if (!a) continue
    out.push({
      key,
      label: def.label,
      display: a.displayValue ?? '—',
      numericValue: a.numericValue ?? 0,
      score: a.score ?? null,
      what: def.what,
    })
  }
  return out
}

function parseOpportunities(audits: Record<string, any>): Opportunity[] {
  return Object.entries(audits)
    .filter(([, a]) => a?.details?.type === 'opportunity')
    .map(([key, a]) => ({
      key,
      title: a.title ?? key,
      description: (a.description ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      savingsMs: Math.round(a.details.overallSavingsMs ?? 0),
      savingsBytes: Math.round(a.details.overallSavingsBytes ?? 0),
      score: a.score ?? null,
    }))
    .filter(o => o.savingsMs > 0 || o.savingsBytes > 0)
    .sort((a, b) => b.savingsMs - a.savingsMs)
    .slice(0, 10)
}

/** A qué categoría pertenece cada auditoría, para poder agrupar los fallos. */
function auditCategoryMap(categories: Record<string, any>): Record<string, string> {
  const map: Record<string, string> = {}
  const NAMES: Record<string, string> = {
    performance: 'Rendimiento',
    accessibility: 'Accesibilidad',
    'best-practices': 'Buenas prácticas',
    seo: 'SEO',
  }
  for (const [catKey, cat] of Object.entries(categories ?? {})) {
    for (const ref of (cat as any).auditRefs ?? []) {
      if (!map[ref.id]) map[ref.id] = NAMES[catKey] ?? catKey
    }
  }
  return map
}

function parseFailed(audits: Record<string, any>, categories: Record<string, any>): FailedAudit[] {
  const cats = auditCategoryMap(categories)
  return Object.entries(audits)
    .filter(([, a]) =>
      typeof a?.score === 'number' &&
      a.score < 0.9 &&
      a.scoreDisplayMode !== 'informative' &&
      a.scoreDisplayMode !== 'notApplicable' &&
      a.title)
    .map(([key, a]) => ({
      key,
      title: a.title,
      description: (a.description ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
      displayValue: a.displayValue ?? '',
      score: a.score,
      category: cats[key] ?? 'Otros',
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 14)
}

export function parsePsi(raw: any, strategy: Strategy): PsiResult {
  const lr = raw.lighthouseResult ?? {}
  const audits: Record<string, any> = lr.audits ?? {}
  const cats = lr.categories ?? {}
  const pct = (c: any) => (typeof c?.score === 'number' ? Math.round(c.score * 100) : null)

  return {
    url: raw.id ?? lr.requestedUrl ?? '',
    finalUrl: lr.finalUrl ?? raw.id ?? '',
    strategy,
    fetchedAt: raw.analysisUTCTimestamp ?? new Date().toISOString(),
    lighthouseVersion: lr.lighthouseVersion ?? '',
    scores: {
      performance: pct(cats.performance),
      accessibility: pct(cats.accessibility),
      bestPractices: pct(cats['best-practices']),
      seo: pct(cats.seo),
    },
    field: parseField(raw.loadingExperience, raw.originLoadingExperience),
    lab: parseLab(audits),
    opportunities: parseOpportunities(audits),
    failedAudits: parseFailed(audits, cats),
    totalBytes: Math.round(audits['total-byte-weight']?.numericValue ?? 0),
    warnings: lr.runWarnings ?? [],
  }
}

export function formatCwv(m: Pick<CwvMetric, 'percentile' | 'unit'>): string {
  if (m.unit === 'score') return m.percentile.toFixed(2)
  if (m.percentile >= 1000) return `${(m.percentile / 1000).toFixed(1)} s`
  return `${Math.round(m.percentile)} ms`
}
