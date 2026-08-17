import type { AuditResult } from '@/lib/scanner/types'

/**
 * Clasificación de madurez digital y recomendación de paquete.
 *
 * El nivel NO se deduce del score de la auditoría (un sitio puede tener un
 * score alto y ser un one-pager sin recorrido). Se deduce de la ESCALA y
 * COMPLEJIDAD observadas —volumen de contenido, inventario de imágenes,
 * arquitectura de enlaces, stack, señales de e-commerce— y el score entra
 * después como modulador de urgencia.
 */

export type MaturityLevel = 'emergente' | 'establecida' | 'consolidada'
export type PackageId = 'radiografia' | 'resonancia' | 'quirofano'

export interface MaturitySignal {
  label: string
  value: string
  points: number
  detail: string
}

export interface Classification {
  level: MaturityLevel
  levelLabel: string
  score: number          // 0–100 de escala/complejidad digital
  signals: MaturitySignal[]
  recommended: PackageId
  rationale: string
  urgency: 'alta' | 'media' | 'baja'
}

const LEVEL_LABEL: Record<MaturityLevel, string> = {
  emergente:   'Presencia emergente',
  establecida: 'Operación establecida',
  consolidada: 'Organización consolidada',
}

export function classify(r: AuditResult): Classification {
  const raw = r.raw
  const signals: MaturitySignal[] = []
  let pts = 0

  // ── Volumen de contenido ──
  const wc = raw.wordCount ?? 0
  const wcPts = wc >= 2000 ? 25 : wc >= 900 ? 16 : wc >= 400 ? 8 : 3
  pts += wcPts
  signals.push({
    label: 'Volumen de contenido',
    value: `${wc.toLocaleString('es-BO')} ${wc === 1 ? 'palabra' : 'palabras'}`,
    points: wcPts,
    detail: wc >= 900
      ? 'Contenido suficiente para sostener posicionamiento por long-tail.'
      : 'Contenido por debajo del umbral que Google asocia a páginas con autoridad temática.',
  })

  // ── Arquitectura de enlaces internos ──
  const il = raw.internalLinks ?? 0
  const ilPts = il >= 40 ? 20 : il >= 15 ? 13 : il >= 6 ? 7 : 2
  pts += ilPts
  signals.push({
    label: 'Arquitectura interna',
    value: `${il} ${il === 1 ? 'enlace interno' : 'enlaces internos'}`,
    points: ilPts,
    detail: il >= 15
      ? 'Estructura navegable: el rastreador puede recorrer el sitio y repartir autoridad.'
      : 'Estructura plana. Con pocos enlaces internos la autoridad no circula entre páginas.',
  })

  // ── Inventario visual ──
  const im = raw.totalImages ?? 0
  const imPts = im >= 60 ? 15 : im >= 25 ? 10 : im >= 8 ? 5 : 2
  pts += imPts
  signals.push({
    label: 'Inventario visual',
    value: `${im} ${im === 1 ? 'imagen' : 'imágenes'}`,
    points: imPts,
    detail: im >= 25
      ? 'Producción visual significativa: hay activos que rentabilizar en búsqueda por imágenes.'
      : 'Poca producción visual propia.',
  })

  // ── Infraestructura técnica ──
  const infra = [raw.robotsTxtExists, raw.sitemapExists, raw.hasSchema, raw.isHttps, raw.canonical != null]
  const infraOk = infra.filter(Boolean).length
  const infraPts = infraOk >= 5 ? 20 : infraOk >= 3 ? 13 : infraOk >= 2 ? 7 : 2
  pts += infraPts
  signals.push({
    label: 'Infraestructura técnica',
    value: `${infraOk}/5 fundamentos`,
    points: infraPts,
    detail: infraOk >= 4
      ? 'Fundamentos técnicos cubiertos: hay sobre qué construir.'
      : 'Faltan fundamentos técnicos básicos (robots, sitemap, schema, canonical o HTTPS).',
  })

  // ── Stack y sofisticación ──
  const techCount = r.tech?.filter(t => t.label !== 'Stack no detectado').length ?? 0
  const hasAnalytics = r.tech?.some(t => /analytics|tag manager|pixel/i.test(t.label)) ?? false
  const techPts = (techCount >= 6 ? 12 : techCount >= 3 ? 8 : 3) + (hasAnalytics ? 8 : 0)
  pts += techPts
  signals.push({
    label: 'Stack tecnológico',
    value: `${techCount} ${techCount === 1 ? 'tecnología' : 'tecnologías'}${hasAnalytics ? ' · con analítica' : ' · sin analítica'}`,
    points: techPts,
    detail: hasAnalytics
      ? 'Hay medición instalada: se puede contrastar el diagnóstico con datos reales.'
      : 'Sin herramienta de analítica detectada: hoy las decisiones se toman a ciegas.',
  })

  const scaleScore = Math.min(100, pts)
  const level: MaturityLevel =
    scaleScore >= 68 ? 'consolidada' : scaleScore >= 38 ? 'establecida' : 'emergente'

  // ── Urgencia: la marca el estado de salud, no la escala ──
  const health = r.scores?.overall ?? 0
  const p0 = r.findings?.filter(f => f.priority === 'P0').length ?? 0
  const p1 = r.findings?.filter(f => f.priority === 'P1').length ?? 0
  const urgency: Classification['urgency'] =
    p0 > 0 || health < 50 ? 'alta' : p1 >= 2 || health < 75 ? 'media' : 'baja'

  // ── Recomendación ──
  // La escala fija el piso; la urgencia puede subir un escalón, nunca bajarlo.
  let recommended: PackageId =
    level === 'consolidada' ? 'resonancia' : level === 'establecida' ? 'radiografia' : 'radiografia'
  if (level === 'consolidada' && urgency === 'alta') recommended = 'quirofano'
  if (level === 'establecida' && urgency === 'alta') recommended = 'resonancia'

  const rationale =
    level === 'consolidada'
      ? `El sitio opera a escala (${wc.toLocaleString('es-BO')} palabras, ${il} enlaces internos, ${techCount} tecnologías). ${
          urgency === 'alta'
            ? `Con ${p0} bloqueo${p0 === 1 ? '' : 's'} crítico${p0 === 1 ? '' : 's'} activo${p0 === 1 ? '' : 's'}, el diagnóstico solo no alcanza: se necesita ejecución acompañada.`
            : 'La prioridad es profundidad analítica sobre un activo que ya funciona.'
        }`
      : level === 'establecida'
        ? `Hay una operación real detrás del sitio, pero con margen estructural. ${
            urgency === 'alta'
              ? 'El estado de salud exige un análisis profundo antes de invertir en captación.'
              : 'Un diagnóstico completo permite priorizar sin gastar de más.'
          }`
        : `La presencia digital está en etapa inicial (${wc.toLocaleString('es-BO')} palabras, ${il} enlaces internos). Conviene ordenar los fundamentos antes de escalar la inversión.`

  return { level, levelLabel: LEVEL_LABEL[level], score: scaleScore, signals, recommended, rationale, urgency }
}

// ── Paquetes ────────────────────────────────────────────────────────────────

export interface Pkg {
  id: PackageId
  name: string
  tagline: string
  /** Precio de referencia en USD. Bolivianos calculados al tipo de cambio oficial. */
  priceUSD: number
  priceBOB: number
  delivery: string
  model: { name: string; id: string; why: string }
  pagesAnalyzed: string
  bestFor: string
  includes: string[]
  excludes?: string[]
}

/** Tipo de cambio oficial BOB/USD (fijo desde 2011). */
export const BOB_PER_USD = 6.96

export const PACKAGES: Pkg[] = [
  {
    id: 'radiografia',
    name: 'Radiografía',
    tagline: 'La foto honesta de dónde estás parado',
    priceUSD: 290,
    priceBOB: Math.round(290 * BOB_PER_USD),
    delivery: '3 días hábiles',
    model: {
      name: 'Claude Haiku 4.5',
      id: 'claude-haiku-4-5',
      why: 'Modelo rápido y económico. Clasifica hallazgos y redacta el diagnóstico con precisión suficiente para un informe de una página.',
    },
    pagesAnalyzed: 'Home + 4 páginas clave',
    bestFor: 'Presencia emergente · sitios de hasta ~10 páginas',
    includes: [
      'Escaneo técnico de 19 módulos (SEO, performance, accesibilidad, conversión)',
      'Render real en móvil, tablet y escritorio como evidencia fechada',
      'Hallazgos priorizados P0–P3 con evidencia verificable',
      'Matriz Impacto × Esfuerzo para decidir qué atacar primero',
      'Informe PDF ejecutivo descargable',
      'Sesión de devolución de 45 minutos',
    ],
    excludes: ['Análisis de competencia medido', 'Conexión a Google Analytics 4', 'Implementación'],
  },
  {
    id: 'resonancia',
    name: 'Resonancia',
    tagline: 'El diagnóstico profundo, con contexto de mercado',
    priceUSD: 780,
    priceBOB: Math.round(780 * BOB_PER_USD),
    delivery: '7 días hábiles',
    model: {
      name: 'Claude Sonnet 5',
      id: 'claude-sonnet-5',
      why: 'Razonamiento extendido: cruza hallazgos entre módulos, detecta causas raíz compartidas y construye la narrativa estratégica, no solo la lista de problemas.',
    },
    pagesAnalyzed: 'Hasta 25 páginas + análisis de arquitectura',
    bestFor: 'Operación establecida · empresas con equipo de marketing',
    includes: [
      'Todo lo de Radiografía, extendido a 25 páginas',
      'Benchmark medido contra 3 competidores reales con el mismo motor',
      'Conexión a Google Analytics 4: el diagnóstico se contrasta con tráfico real',
      'Auditoría de credibilidad web (Stanford) y heurísticas de usabilidad (NN/g)',
      'Roadmap por sprints con estimación de esfuerzo e impacto',
      'Hipótesis de conversión con método de validación definido',
      '2 sesiones de trabajo con el equipo del cliente',
    ],
    excludes: ['Implementación de las correcciones'],
  },
  {
    id: 'quirofano',
    name: 'Quirófano',
    tagline: 'Diagnóstico, ejecución y control de resultado',
    priceUSD: 2_400,
    priceBOB: Math.round(2400 * BOB_PER_USD),
    delivery: '30 días · ciclo completo',
    model: {
      name: 'Claude Opus 5',
      id: 'claude-opus-5',
      why: 'El modelo más capaz de la familia. Se usa donde el costo de un diagnóstico equivocado supera con creces el costo del análisis: arquitectura de información, decisiones de migración y priorización con dinero real en juego.',
    },
    pagesAnalyzed: 'Sitio completo + entorno competitivo',
    bestFor: 'Organización consolidada · e-commerce, multi-sede o alto tráfico',
    includes: [
      'Todo lo de Resonancia, sin límite de páginas',
      'Corrección implementada de todos los hallazgos P0 y P1',
      'Rediseño de los recorridos críticos de conversión',
      'Datos de campo de Core Web Vitals (CrUX) y plan de performance',
      'Schema estructurado completo, incluido LocalBusiness',
      'Re-auditoría a los 30 días para medir el delta real',
      'Acompañamiento directo del equipo de Baral durante todo el ciclo',
    ],
  },
]

export function getPackage(id: PackageId): Pkg {
  return PACKAGES.find(p => p.id === id) ?? PACKAGES[0]
}
