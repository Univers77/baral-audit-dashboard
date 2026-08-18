import fs from 'fs'
import path from 'path'
import type { ErrorCode } from '@/lib/observability/log'
import { CACHE_DIR, EVENTS_FILE, OBSIDIAN_DIR } from './paths'
import type { AuditResult } from './types'

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/** Una línea de la bitácora: qué se intentó auditar y cómo terminó. */
export interface ScanEvent {
  ts: string
  domain: string
  url: string
  outcome: 'ok' | 'error'
  durationMs: number
  /** presentes solo si outcome === 'ok' */
  overall?: number
  findings?: number
  statusCode?: number
  /** presentes solo si outcome === 'error' */
  code?: ErrorCode
  message?: string
}

/**
 * Registra el intento en una bitácora append-only.
 *
 * El JSON por dominio guarda únicamente el último escaneo: cada nueva ejecución
 * sobrescribe la anterior, y los intentos fallidos no dejaban rastro alguno.
 * Para una herramienta cuyo propósito es detectar fallos y regresiones, ese
 * era justamente el dato que se perdía. Aquí no se sobrescribe nada.
 */
export function recordScanEvent(event: ScanEvent): void {
  try {
    ensureDir(CACHE_DIR)
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n', 'utf-8')
  } catch {
    // La bitácora es observabilidad, no parte del resultado: si el disco es de
    // solo lectura (Vercel), no debe tumbar el escaneo.
  }
}

function scoreEmoji(n: number) {
  if (n >= 80) return '🟢'
  if (n >= 60) return '🟡'
  if (n >= 40) return '🟠'
  return '🔴'
}

function priorityBadge(p: string) {
  return p === 'P0' ? '🚨' : p === 'P1' ? '⚠️' : p === 'P2' ? '📌' : '💡'
}

export function saveResult(result: AuditResult): { jsonPath: string; mdPath: string } {
  ensureDir(CACHE_DIR)

  const jsonPath = path.join(CACHE_DIR, `${result.domain}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8')

  // ── Obsidian markdown ──────────────────────────────────────
  const { scores, findings, compactFindings, tech, raw } = result
  const scanDate = new Date(result.scanDate).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })

  const md = `# Auditoría AUDITOR-X — ${result.domain}

> Generado: ${scanDate}
> URL: ${result.url}
> Score global: **${scores.overall}/100** ${scoreEmoji(scores.overall)}

## Scores

| Dimensión | Score |
|---|---|
| SEO On-Page | ${scores.seo}/100 ${scoreEmoji(scores.seo)} |
| Performance | ${scores.performance}/100 ${scoreEmoji(scores.performance)} |
| Accesibilidad | ${scores.accessibility}/100 ${scoreEmoji(scores.accessibility)} |
| Conversión | ${scores.conversion}/100 ${scoreEmoji(scores.conversion)} |

## Señales técnicas detectadas

- **TTFB**: ${raw.ttfb}ms
- **HTTPS**: ${raw.isHttps ? '✅' : '❌'}
- **Title**: ${raw.title ? `"${raw.title}" (${raw.titleLen} chars)` : '❌ ausente'}
- **Meta description**: ${raw.metaDescription ? `${raw.metaDescLen} chars` : '❌ ausente'}
- **H1**: ${raw.h1s.length} encontrados${raw.h1s.length > 0 ? `: "${raw.h1s[0]}"` : ''}
- **Imágenes**: ${raw.totalImages} total, ${raw.imagesWithoutAlt} sin alt
- **Palabras**: ${raw.wordCount}
- **Schema**: ${raw.hasSchema ? `✅ (${raw.schemaTypes.join(', ')})` : '❌'}
- **Open Graph**: ${raw.hasOpenGraph ? '✅' : '❌'}
- **Robots.txt**: ${raw.robotsTxtExists ? '✅' : '❌'}
- **Sitemap.xml**: ${raw.sitemapExists ? '✅' : '❌'}

## Tech Stack detectado

${tech.map(t => `- ${t.label}${t.note ? ` — ${t.note}` : ''}`).join('\n')}

## Hallazgos principales (P0/P1)

${findings.length === 0 ? '_Sin hallazgos críticos detectados._' : findings.map(f => `
### ${priorityBadge(f.priority)} [${f.priority}] ${f.title}

**ID**: \`${f.id}\` | **Módulo**: ${f.module} | **Esfuerzo**: ${f.effort} | **Confianza**: ${f.confidence}%

**Qué es**: ${f.what}

**Impacto negocio**: ${f.impactBusiness}

**Dirección de corrección**: ${f.direction}

**Cómo validar**: ${f.validate}

**Evidencia**:
${f.evidence.map(e => `- ${e.source}: \`${e.value}\``).join('\n')}
`).join('\n---\n')}

## Hallazgos secundarios (P2/P3)

${compactFindings.length === 0 ? '_Ninguno._' : compactFindings.map(f =>
  `- ${priorityBadge(f.priority)} **[${f.priority}]** \`${f.id}\` ${f.title} _(${f.effort})_`
).join('\n')}

---
_Generado por AUDITOR-X / baral-audit-dashboard_
`

  let mdPath = ''
  try {
    ensureDir(OBSIDIAN_DIR)
    mdPath = path.join(OBSIDIAN_DIR, `${result.domain}.md`)
    fs.writeFileSync(mdPath, md, 'utf-8')
  } catch {
    // Obsidian vault puede no existir en todos los entornos — no es bloqueante
    mdPath = ''
  }

  return { jsonPath, mdPath }
}
