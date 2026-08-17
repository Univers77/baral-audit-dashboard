import Anthropic from '@anthropic-ai/sdk'
import type { AuditResult, RawScan } from './types'

export interface ClaudeEnrichment {
  executiveSummary: string
  topPriority: string
  quickWins: string[]
  strategicNote: string
  criticalIssues: string[]
  dataConfidence: 'ALTA' | 'MEDIA' | 'BAJA'
}

export async function enrichWithClaude(
  result: AuditResult,
  raw: RawScan
): Promise<ClaudeEnrichment | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const client = new Anthropic({ apiKey })

  // Extraer headers relevantes
  const relevantHeaders: Record<string, string> = {}
  const headerKeys = ['server', 'x-powered-by', 'cache-control', 'x-cache', 'cf-cache-status', 'content-encoding']
  for (const k of headerKeys) {
    if (raw.headers[k]) relevantHeaders[k] = raw.headers[k]
  }

  // Payload completo para análisis quirúrgico
  const payload = {
    // Identidad
    url: result.url,
    domain: result.domain,
    statusCode: raw.statusCode,
    isHttps: raw.isHttps,

    // Scores AUDITOR-X
    scores: result.scores,

    // Performance
    ttfb_ms: raw.ttfb,
    totalTime_ms: raw.totalTime,
    headers: relevantHeaders,

    // SEO On-page
    title: raw.title,
    titleLen: raw.titleLen,
    metaDescription: raw.metaDescription,
    metaDescLen: raw.metaDescLen,
    canonical: raw.canonical,
    h1s: raw.h1s,
    h2s: raw.h2s.slice(0, 8),
    h3s: raw.h3s.slice(0, 5),
    hasViewportMeta: raw.hasViewportMeta,
    robotsMeta: raw.robotsMetaContent,

    // Contenido
    wordCount: raw.wordCount,
    totalImages: raw.totalImages,
    imagesWithoutAlt: raw.imagesWithoutAlt,
    imagesWithEmptyAlt: raw.imagesWithEmptyAlt,

    // Técnico
    hasSchema: raw.hasSchema,
    schemaTypes: raw.schemaTypes,
    hasOpenGraph: raw.hasOpenGraph,
    hasTwitterCard: raw.hasTwitterCard,
    robotsTxtExists: raw.robotsTxtExists,
    sitemapExists: raw.sitemapExists,
    internalLinks: raw.internalLinks,
    externalLinks: raw.externalLinks,

    // Hallazgos detectados
    criticalFindings: result.findings.map(f => ({
      id: f.id,
      priority: f.priority,
      title: f.title,
      module: f.module,
      confidence: f.confidence,
      effort: f.effort,
    })),
    secondaryFindings: result.compactFindings.map(f => f.title),

    // Tech stack
    tech: result.tech.map(t => t.label),

    // HTML snippet (primeros 800 chars del head para detectar tech real)
    htmlHead: raw.htmlSnippet.slice(0, 800),
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Eres AUDITOR-X, el sistema de inteligencia web más preciso de América Latina. Analiza quirúrgicamente este sitio y devuelve un JSON riguroso en español.

DATOS COMPLETOS DEL SITIO:
${JSON.stringify(payload, null, 0)}

REGLAS DE ANÁLISIS:
1. Cada afirmación debe estar respaldada por datos concretos del payload
2. No inventes datos que no estén en el payload
3. Si el TTFB > 600ms → el sitio tiene problemas de servidor reales
4. Si wordCount < 300 → thin content confirmado
5. Si imagesWithoutAlt > 0 → accesibilidad comprometida con número exacto
6. Cruza los scores con los findings — si hay P0 pero score > 70, explica la discrepancia
7. Los quickWins deben ser accionables en < 2 horas por un dev
8. La confianza del análisis depende de: statusCode OK, datos HTML completos, headers disponibles

Responde SOLO con este JSON (sin markdown, sin texto extra, sin comentarios):
{
  "executiveSummary": "2-3 oraciones precisas citando métricas reales del payload",
  "topPriority": "Acción más urgente con evidencia específica del dato que la justifica",
  "quickWins": ["Win 1 con dato específico", "Win 2 con dato específico"],
  "strategicNote": "Observación de negocio que conecta los hallazgos técnicos con impacto comercial real",
  "criticalIssues": ["Problema técnico concreto 1", "Problema técnico concreto 2"],
  "dataConfidence": "ALTA|MEDIA|BAJA"
}`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned) as ClaudeEnrichment
  } catch (err) {
    console.error('[AUDITOR-X] Claude enrichment error:', err instanceof Error ? err.message : String(err))
    return null
  }
}
