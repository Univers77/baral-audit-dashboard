'use client'

/**
 * Lectura estratégica de la comparación.
 *
 * La tabla comparativa responde «quién gana cada métrica». Esto responde la
 * pregunta siguiente, que es la que decide presupuesto: dónde conviene invertir
 * y dónde no. Se usa igual en pantalla y dentro del informe descargable, así
 * que todo va con estilos en línea y colores en hexadecimal — html2canvas no
 * interpreta los `oklch()` de la interfaz.
 */

import {
  analyzeCompetition, byPriority, STANCE_META,
  type CompetitiveAnalysis, type MetricAnalysis, type Subject,
} from '@/lib/competitive/analysis'
import { CompetitiveBars, RC, StanceSummary, STANCE_COLOR, type ComparisonRow } from './report-charts'
import type { AuditResult } from '@/lib/scanner/types'

const SANS = 'Arial, Helvetica, sans-serif'
const MONO = 'Consolas, "Courier New", monospace'

/** Métricas que se grafican: las cinco de puntaje más las tres medibles en unidades propias. */
const CHARTED = ['overall', 'seo', 'performance', 'accessibility', 'conversion', 'ttfb', 'words', 'internalLinks'] as const

const TARGETS: Record<string, number> = {
  overall: 80, seo: 80, performance: 80, accessibility: 80, conversion: 80,
  ttfb: 800, words: 800, internalLinks: 15,
}

function buildRows(analysis: CompetitiveAnalysis, own: AuditResult, rivals: Subject[]): ComparisonRow[] {
  const domains = [own.domain, ...rivals.map(r => r.domain)]

  return analysis.metrics
    .filter(m => (CHARTED as readonly string[]).includes(m.key))
    .map(m => {
      // Los valores por dominio se reconstruyen desde el propio análisis para
      // no volver a recorrer los resultados crudos.
      const all = [own, ...rivals.map(r => r.result)]
      const values = all.map((r, i) => {
        const row = analysisValue(m, r)
        return { domain: domains[i], value: row, display: m.format(row) }
      })
      const max = Math.max(...values.map(v => v.value), TARGETS[m.key] ?? 0) * 1.05
      return { label: m.label, values, lowerIsBetter: m.lowerIsBetter, target: TARGETS[m.key], max }
    })
}

/** Valor de una métrica en un resultado concreto. */
function analysisValue(m: MetricAnalysis, r: AuditResult): number {
  switch (m.key) {
    case 'overall': return r.scores.overall
    case 'seo': return r.scores.seo
    case 'performance': return r.scores.performance
    case 'accessibility': return r.scores.accessibility
    case 'conversion': return r.scores.conversion
    case 'ttfb': return r.raw.ttfb
    case 'words': return r.raw.wordCount
    case 'internalLinks': return r.raw.internalLinks
    case 'altPct': return r.raw.totalImages > 0 ? Math.round((r.raw.imagesWithoutAlt / r.raw.totalImages) * 100) : 0
    default: return r.raw.hasSchema ? 1 : 0
  }
}

function MetricCard({ m }: { m: MetricAnalysis }) {
  const color = STANCE_COLOR[m.stance] ?? RC.faint
  return (
    <div style={{
      background: RC.surface, border: `1px solid ${RC.borderSoft}`, borderLeft: `3px solid ${color}`,
      borderRadius: 6, padding: '12px 14px', breakInside: 'avoid',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: RC.ink }}>{m.label}</span>
        <span style={{
          fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: 0.6,
          padding: '2px 7px', borderRadius: 3, background: RC.surfaceAlt, color,
        }}>
          {STANCE_META[m.stance].short}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: RC.faint, marginLeft: 'auto' }}>
          puesto {m.rank} de {m.total}
        </span>
      </div>
      <p style={{ fontSize: 11, color: RC.inkSoft, margin: '6px 0 0', lineHeight: 1.5 }}>{m.reading}</p>
      <p style={{ fontSize: 11, color: RC.muted, margin: '4px 0 0', lineHeight: 1.5 }}>{m.action}</p>
    </div>
  )
}

export function CompetitiveInsight({
  own, rivals, compact = false,
}: {
  own: AuditResult
  rivals: Subject[]
  /** en el PDF se recorta a lo accionable para no ocupar tres hojas */
  compact?: boolean
}) {
  if (rivals.length === 0) return null

  const analysis = analyzeCompetition(own, rivals)
  const rows = buildRows(analysis, own, rivals)
  const ordered = [...analysis.metrics].sort(byPriority)
  const shown = compact
    ? ordered.filter(m => m.stance === 'territorio-libre' || m.stance === 'desventaja' || m.stance === 'ventaja').slice(0, 6)
    : ordered

  const counts = (['territorio-libre', 'desventaja', 'ventaja', 'paridad'] as const).map(k => ({
    key: k, label: STANCE_META[k].label, n: analysis.counts[k],
  }))

  return (
    <div style={{ fontFamily: SANS, color: RC.ink }}>
      <div style={{
        background: RC.surface, border: `1px solid ${RC.border}`, borderLeft: `3px solid ${RC.quasar}`,
        borderRadius: 6, padding: '13px 15px', marginBottom: 18,
      }}>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 1.4, color: RC.quasarLight, margin: '0 0 5px' }}>
          DÓNDE INVERTIR
        </p>
        <p style={{ fontSize: 12.5, color: RC.ink, margin: 0, lineHeight: 1.55 }}>{analysis.headline}</p>
        <p style={{ fontSize: 10.5, color: RC.muted, margin: '6px 0 0' }}>
          Posición media en el grupo: {analysis.averageRank} de {analysis.metrics[0]?.total ?? 1}.
        </p>
      </div>

      <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px', color: RC.ink }}>
        Reparto de las {analysis.metrics.length} métricas
      </h3>
      <div style={{ marginBottom: 20 }}>
        <StanceSummary counts={counts} />
      </div>

      <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px', color: RC.ink }}>
        Métrica a métrica
      </h3>
      <p style={{ fontSize: 10.5, color: RC.muted, margin: '0 0 10px', lineHeight: 1.5 }}>
        La línea de puntos marca el objetivo. Tu sitio va en violeta.
      </p>
      <div style={{ marginBottom: 22 }}>
        <CompetitiveBars rows={rows} />
      </div>

      <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px', color: RC.ink }}>
        Qué hacer con cada una
      </h3>
      <p style={{ fontSize: 10.5, color: RC.muted, margin: '0 0 10px', lineHeight: 1.5 }}>
        Ordenado por lo accionable: primero donde nadie llega al estándar, después la deuda con
        quien va delante.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.map(m => <MetricCard key={m.key} m={m} />)}
      </div>
    </div>
  )
}
