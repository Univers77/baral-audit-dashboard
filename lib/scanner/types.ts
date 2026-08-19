import type { HeadingNode } from './headings'
import type { SitemapInfo } from './sitemap'
import type { AgentReadiness, FormStats, SchemaIdentity } from './agent-readiness'
import type { ScoreCoverage } from './coverage'
import type { PsiResult } from '@/lib/psi/types'

export interface RawScan {
  url: string
  domain: string
  fetchedAt: string
  // Timing
  ttfb: number        // ms
  totalTime: number   // ms
  // HTTP
  statusCode: number
  isHttps: boolean
  headers: Record<string, string>
  contentLength: number | null
  // HTML
  title: string
  titleLen: number
  metaDescription: string
  metaDescLen: number
  h1s: string[]
  h2s: string[]
  h3s: string[]
  /** todos los encabezados en orden de documento — permite validar la jerarquía */
  headingOutline: HeadingNode[]
  canonical: string | null
  hasViewportMeta: boolean
  hasRobotsMeta: boolean
  robotsMetaContent: string
  // Images
  totalImages: number
  /** sin atributo alt + con alt="" — ambos son invisibles para SEO y lectores de pantalla */
  imagesWithoutAlt: number
  imagesWithEmptyAlt: number
  imagesNoAltAttr: number
  // Content
  wordCount: number
  /** scripts en el HTML servido — con wordCount bajo delata render en cliente */
  scriptCount: number
  /** contenedor raíz típico de una aplicación que se monta en el navegador */
  hasSpaRoot: boolean
  hasSchema: boolean
  schemaTypes: string[]
  /** campos presentes por nodo de identidad — lo que un agente puede leer */
  schemaIdentity: SchemaIdentity[]
  forms: FormStats
  hasOpenGraph: boolean
  hasTwitterCard: boolean
  // Links
  internalLinks: number
  externalLinks: number
  /** externos con rel=nofollow — no transmiten autoridad */
  externalNofollow: number
  /** rutas internas reales halladas, para capturar páginas distintas */
  internalUrls: string[]
  brokenLinks: string[]
  // Usabilidad / calidad de código
  hreflangCount: number
  langAttr: string | null
  hasFavicon: boolean
  iframeCount: number
  inlineStyleCount: number
  /** emails visibles en el HTML — cosechables por bots de spam */
  emailsInPlainText: string[]
  // External checks
  robotsTxtExists: boolean
  sitemapExists: boolean
  /** estándar propuesto para guiar crawlers de LLMs */
  llmsTxtExists: boolean
  /** contenido de robots.txt, truncado. Antes solo se comprobaba existencia. */
  robotsTxtContent: string | null
  /** sitemap ya parseado: el XML crudo puede pesar megabytes */
  sitemapInfo: SitemapInfo | null
  llmsTxtContent: string | null
  /** manifiestos de descubrimiento para agentes */
  wellKnown: { aiPlugin: boolean; mcp: boolean }
  // Raw HTML (truncated for analysis)
  htmlSnippet: string
  /** stack detectado sobre el HTML completo, no sobre htmlSnippet */
  techDetected: { label: string; crit: boolean; note: string }[]
  // Screenshot URL — alias de screenshots.desktop (compatibilidad)
  screenshotUrl: string
  // Renders por dispositivo: cada uno se captura con el viewport real del
  // dispositivo, así se disparan los breakpoints responsive del sitio y el
  // render de móvil difiere del de desktop (misma técnica que SEOptimer).
  screenshots: DeviceShots
}

export type DeviceKey = 'mobile' | 'tablet' | 'desktop'

export interface DeviceShots {
  mobile: string
  tablet: string
  desktop: string
}

export interface ScanError {
  url: string
  error: string
  statusCode?: number
}

export interface AuditResult {
  domain: string
  url: string
  scanDate: string
  scores: {
    overall: number
    performance: number
    seo: number
    accessibility: number
    conversion: number
  }
  findings: AuditFinding[]
  compactFindings: AuditCompactFinding[]
  tech: { label: string; crit: boolean; note: string }[]
  raw: RawScan
  /** eje independiente: legibilidad del sitio para agentes de IA */
  agentReadiness: AgentReadiness
  /** de qué se sostiene cada puntaje — un chequeo no ejecutado no es un aprobado */
  coverage: ScoreCoverage
  /**
   * PageSpeed se dispara desde el cliente y se adjunta aquí antes de exportar.
   * Sin esto el cliente veía Core Web Vitals en pantalla que desaparecían del
   * PDF y del JSON que se le entregaba.
   */
  psi?: PsiResult
  claudeEnrichment?: {
    executiveSummary: string
    topPriority: string
    quickWins: string[]
    strategicNote: string
    criticalIssues?: string[]
    dataConfidence?: 'ALTA' | 'MEDIA' | 'BAJA'
  }
}

export interface AuditFinding {
  id: string
  module: string
  category: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  stage: string
  title: string
  what: string
  impactBusiness: string
  impactUser: string
  impactTech: string
  evidence: { source: string; value: string }[]
  confidence: number
  severity: 1 | 2 | 3 | 4 | 5
  scope: 1.0 | 1.5 | 2.0
  businessImpact: 1.0 | 1.5 | 2.0
  auditxStatus: string
  effort: 'Bajo' | 'Medio' | 'Alto'
  direction: string
  validate: string
  impact3mo: string
  impact6mo: string
}

export interface AuditCompactFinding {
  id: string
  module: string
  title: string
  effort: 'Bajo' | 'Medio' | 'Alto'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
}
