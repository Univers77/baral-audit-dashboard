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
  hasSchema: boolean
  schemaTypes: string[]
  hasOpenGraph: boolean
  hasTwitterCard: boolean
  // Links
  internalLinks: number
  externalLinks: number
  /** externos con rel=nofollow — no transmiten autoridad */
  externalNofollow: number
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
