/**
 * Lectura estratégica de la comparación con competidores.
 *
 * La tabla comparativa dice quién gana cada métrica, que es un dato pero no una
 * decisión. Lo que hace falta saber es otra cosa: dónde conviene invertir y
 * dónde no.
 *
 * El marco es el clásico de análisis competitivo aplicado a lo que aquí se
 * puede medir de verdad. Cada métrica cae en una de cuatro posiciones:
 *
 * - **Ventaja**: se lidera con margen. No hay nada que arreglar; hay algo que
 *   contar en la propuesta comercial.
 * - **Paridad**: todos rondan lo mismo. Invertir aquí cuesta y no diferencia,
 *   porque el cliente no percibe la diferencia entre iguales.
 * - **Desventaja**: alguien va por delante con margen. Es deuda competitiva.
 * - **Territorio libre**: nadie del conjunto llega al umbral objetivo, incluido
 *   uno mismo. Es la posición más rentable: se diferencia sin tener que superar
 *   a nadie, solo alcanzando un estándar que el mercado local ignora.
 *
 * El umbral de «margen» existe para no llamar ventaja a un punto de diferencia:
 * el motor puntúa en saltos discretos, así que una distancia pequeña es ruido y
 * tratarla como señal lleva a invertir en nada.
 */

import { comparableRow, COMPARABLE_LABELS, type ComparableKey } from '@/lib/benchmarks'
import type { AuditResult } from '@/lib/scanner/types'

export type Stance = 'ventaja' | 'paridad' | 'desventaja' | 'territorio-libre'

export interface Subject {
  domain: string
  result: AuditResult
}

export interface MetricAnalysis {
  key: ComparableKey
  label: string
  lowerIsBetter: boolean
  format: (v: number | boolean) => string
  /** valor propio */
  yours: number
  /** mejor valor del conjunto, incluido el propio */
  best: number
  bestDomain: string
  average: number
  /** 1 es la mejor posición */
  rank: number
  total: number
  /** distancia al mejor, siempre positiva; 0 si se lidera */
  gap: number
  stance: Stance
  reading: string
  action: string
}

export interface CompetitiveAnalysis {
  metrics: MetricAnalysis[]
  counts: Record<Stance, number>
  /** posición media en el conjunto, 1 = primero en todo */
  averageRank: number
  headline: string
}

/**
 * Umbral por debajo del cual una diferencia es ruido de medición, no señal.
 * En los puntajes 0–100 el motor se mueve en saltos de varios puntos.
 */
const NOISE: Partial<Record<ComparableKey, number>> = {
  overall: 8, seo: 8, performance: 8, accessibility: 8, conversion: 8,
  ttfb: 250, words: 200, altPct: 15, internalLinks: 8, schema: 1,
}

/**
 * Umbral objetivo de cada métrica. Los de contenido, enlaces, alt y respuesta
 * salen de lib/benchmarks, que ya los declara con fuente citable; los puntajes
 * usan 80, que es el listón a partir del cual un pilar se considera sano.
 */
const TARGET: Record<ComparableKey, number> = {
  overall: 80, seo: 80, performance: 80, accessibility: 80, conversion: 80,
  ttfb: 800, words: 800, altPct: 5, internalLinks: 15, schema: 1,
}

function reachesTarget(key: ComparableKey, value: number, lowerIsBetter: boolean): boolean {
  return lowerIsBetter ? value <= TARGET[key] : value >= TARGET[key]
}

function numeric(value: number | boolean): number {
  return typeof value === 'boolean' ? (value ? 1 : 0) : value
}

function readingFor(m: Omit<MetricAnalysis, 'reading' | 'action'>): { reading: string; action: string } {
  const fmt = m.format
  switch (m.stance) {
    case 'territorio-libre':
      return {
        reading: `Nadie del grupo alcanza el objetivo de ${fmt(TARGET[m.key])}. El mejor se queda en ${fmt(m.best)}.`,
        action: 'Es la oportunidad más barata del análisis: aquí se diferencia alcanzando un estándar, sin tener que superar a nadie.',
      }
    case 'ventaja':
      return {
        reading: `Se lidera con ${fmt(m.yours)}, por delante del resto del grupo.`,
        action: 'No requiere inversión. Es material para la propuesta comercial: una ventaja que no se cuenta no existe para el cliente.',
      }
    case 'desventaja':
      return {
        reading: `${m.bestDomain} va por delante con ${fmt(m.best)} frente a ${fmt(m.yours)}.`,
        action: 'Deuda competitiva: se está perdiendo terreno en algo que un competidor ya resolvió.',
      }
    default:
      return {
        reading: `Todos rondan lo mismo, entre ${fmt(m.yours)} y ${fmt(m.best)}.`,
        action: 'Invertir aquí cuesta y no diferencia: el cliente no percibe distancia entre iguales. Conviene mirar a otra métrica.',
      }
  }
}

/**
 * @param own resultado del sitio propio
 * @param rivals competidores ya escaneados con el mismo motor
 */
export function analyzeCompetition(own: AuditResult, rivals: Subject[]): CompetitiveAnalysis {
  const all: Subject[] = [{ domain: own.domain, result: own }, ...rivals]
  const rows = all.map(s => ({ domain: s.domain, row: comparableRow(s.result) }))

  const metrics: MetricAnalysis[] = COMPARABLE_LABELS.map(def => {
    const lowerIsBetter = def.lowerIsBetter === true
    const values = rows.map(r => ({ domain: r.domain, value: numeric(r.row[def.key]) }))
    const yours = values[0].value

    const sorted = [...values].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))
    const best = sorted[0]
    const average = values.reduce((a, v) => a + v.value, 0) / values.length
    const rank = sorted.findIndex(v => v.domain === values[0].domain) + 1

    // Quien lidera tiene distancia cero al mejor, porque el mejor es él. Su
    // margen real es contra el segundo: sin esta distinción, liderar por
    // goleada se leía como empate.
    const reference = rank === 1 ? (sorted[1]?.value ?? yours) : best.value
    const gap = Math.abs(reference - yours)
    const significant = gap >= (NOISE[def.key] ?? 1)

    // Territorio libre solo cuando nadie llega al objetivo *y* nadie saca
    // ventaja apreciable. Si alguien va claramente por delante, aunque siga
    // bajo el estándar, lo que manda es esa distancia: hay algo que cerrar.
    const nadieLlega = !values.some(v => reachesTarget(def.key, v.value, lowerIsBetter))

    let stance: Stance
    if (nadieLlega && !significant) stance = 'territorio-libre'
    else if (!significant) stance = 'paridad'
    else if (rank === 1) stance = 'ventaja'
    else stance = 'desventaja'

    const partial = {
      key: def.key,
      label: def.label,
      lowerIsBetter,
      format: def.fmt,
      yours,
      best: best.value,
      bestDomain: best.domain,
      average: Math.round(average * 10) / 10,
      rank,
      total: values.length,
      gap: Math.round(gap * 10) / 10,
      stance,
    }

    return { ...partial, ...readingFor(partial) }
  })

  const counts: Record<Stance, number> = {
    ventaja: 0, paridad: 0, desventaja: 0, 'territorio-libre': 0,
  }
  for (const m of metrics) counts[m.stance]++

  const averageRank = Math.round((metrics.reduce((a, m) => a + m.rank, 0) / metrics.length) * 10) / 10

  return { metrics, counts, averageRank, headline: headlineFor(counts, metrics) }
}

function headlineFor(counts: Record<Stance, number>, metrics: MetricAnalysis[]): string {
  const libres = metrics.filter(m => m.stance === 'territorio-libre')
  if (libres.length >= 2) {
    return `Hay ${libres.length} métricas donde nadie del grupo alcanza el estándar. Es donde se diferencia más barato: ${libres.slice(0, 2).map(m => m.label.toLowerCase()).join(' y ')}.`
  }
  if (counts.desventaja > counts.ventaja) {
    return `El grupo va por delante en ${counts.desventaja} métricas y por detrás en ${counts.ventaja}. Conviene cerrar deuda antes que abrir frentes nuevos.`
  }
  if (counts.ventaja > 0) {
    return `Se lidera en ${counts.ventaja} de ${metrics.length} métricas. El trabajo pendiente es contarlo, no construirlo.`
  }
  return 'El grupo está muy igualado: ninguna métrica separa de forma clara, así que la diferenciación tendrá que venir de algo que esta medición no captura.'
}

export const STANCE_META: Record<Stance, { label: string; short: string; order: number }> = {
  'territorio-libre': { label: 'Territorio libre', short: 'LIBRE', order: 0 },
  desventaja: { label: 'Desventaja', short: 'DETRÁS', order: 1 },
  ventaja: { label: 'Ventaja', short: 'DELANTE', order: 2 },
  paridad: { label: 'Paridad', short: 'IGUAL', order: 3 },
}

/** Ordena poniendo delante lo accionable: territorio libre, luego deuda. */
export function byPriority(a: MetricAnalysis, b: MetricAnalysis): number {
  const d = STANCE_META[a.stance].order - STANCE_META[b.stance].order
  return d !== 0 ? d : b.gap - a.gap
}
