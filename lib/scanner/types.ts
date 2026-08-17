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
  imagesWithoutAlt: number
  imagesWithEmptyAlt: number
  // Content
  wordCount: number
  hasSchema: boolean
  schemaTypes: string[]
  hasOpenGraph: boolean
  hasTwitterCard: boolean
  // Links
  internalLinks: number
  externalLinks: number
  brokenLinks: string[]
  // External checks
  robotsTxtExists: boolean
  sitemapExists: boolean
  // Raw HTML (truncated for analysis)
  htmlSnippet: string
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
