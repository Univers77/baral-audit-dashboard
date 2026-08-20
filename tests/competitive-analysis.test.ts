import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyzeCompetition, byPriority, type Subject } from '@/lib/competitive/analysis'
import type { AuditResult } from '@/lib/scanner/types'

/**
 * Esta lectura decide dónde se invierte. Los dos errores caros son opuestos:
 * llamar ventaja a un punto de diferencia —que lleva a no hacer nada donde sí
 * hacía falta— y llamar desventaja a un empate, que lleva a gastar en algo que
 * el cliente no va a percibir.
 */

function sitio(over: {
  domain: string
  overall?: number; seo?: number; performance?: number; accessibility?: number; conversion?: number
  ttfb?: number; words?: number; altPct?: number; internalLinks?: number; schema?: boolean
}): AuditResult {
  const total = over.altPct === undefined ? 100 : 100
  const sinAlt = over.altPct === undefined ? 0 : Math.round((over.altPct / 100) * total)
  return {
    domain: over.domain,
    url: `https://${over.domain}/`,
    scanDate: '2026-08-20T00:00:00.000Z',
    scores: {
      overall: over.overall ?? 70,
      performance: over.performance ?? 70,
      seo: over.seo ?? 70,
      accessibility: over.accessibility ?? 70,
      conversion: over.conversion ?? 70,
    },
    findings: [], compactFindings: [], tech: [],
    agentReadiness: { score: 50, coverage: { run: 7, total: 7 }, bots: [], blockedCount: 0, checks: [] },
    coverage: { pillars: [], overallPct: 0 },
    raw: {
      ttfb: over.ttfb ?? 500,
      wordCount: over.words ?? 500,
      totalImages: total,
      imagesWithoutAlt: sinAlt,
      internalLinks: over.internalLinks ?? 10,
      hasSchema: over.schema ?? true,
    } as AuditResult['raw'],
  } as AuditResult
}

const rivalesDe = (...s: AuditResult[]): Subject[] => s.map(r => ({ domain: r.domain, result: r }))

const metrica = (a: ReturnType<typeof analyzeCompetition>, key: string) =>
  a.metrics.find(m => m.key === key)!

describe('analyzeCompetition — territorio libre', () => {
  it('marca libre la métrica donde nadie alcanza el objetivo', () => {
    // Objetivo de enlaces internos: 15. Nadie llega.
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', internalLinks: 4 }),
      rivalesDe(sitio({ domain: 'a.com', internalLinks: 9 }), sitio({ domain: 'b.com', internalLinks: 6 })),
    )
    assert.equal(metrica(a, 'internalLinks').stance, 'territorio-libre')
  })

  it('si alguien saca ventaja clara, manda esa distancia aunque nadie llegue al objetivo', () => {
    // Nadie alcanza los 15 enlaces, pero 12 contra 3 no es un empate: hay una
    // ventaja real que contar, y llamarlo territorio libre la escondería.
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', internalLinks: 12 }),
      rivalesDe(sitio({ domain: 'a.com', internalLinks: 3 })),
    )
    const m = metrica(a, 'internalLinks')
    assert.equal(m.rank, 1)
    assert.equal(m.stance, 'ventaja')
  })

  it('el margen de quien lidera se mide contra el segundo, no contra sí mismo', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', seo: 95 }),
      rivalesDe(sitio({ domain: 'a.com', seo: 60 }), sitio({ domain: 'b.com', seo: 55 })),
    )
    assert.equal(metrica(a, 'seo').gap, 35)
  })

  it('deja de ser libre en cuanto alguien alcanza el objetivo', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', internalLinks: 4 }),
      rivalesDe(sitio({ domain: 'a.com', internalLinks: 40 })),
    )
    assert.equal(metrica(a, 'internalLinks').stance, 'desventaja')
  })
})

describe('analyzeCompetition — ventaja y desventaja', () => {
  it('reconoce ventaja cuando se lidera con margen', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', seo: 95 }),
      rivalesDe(sitio({ domain: 'a.com', seo: 60 }), sitio({ domain: 'b.com', seo: 55 })),
    )
    const m = metrica(a, 'seo')
    assert.equal(m.stance, 'ventaja')
    assert.equal(m.rank, 1)
  })

  it('reconoce desventaja y nombra a quien va delante', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', seo: 55 }),
      rivalesDe(sitio({ domain: 'lider.com', seo: 92 })),
    )
    const m = metrica(a, 'seo')
    assert.equal(m.stance, 'desventaja')
    assert.equal(m.bestDomain, 'lider.com')
    assert.equal(m.gap, 37)
  })
})

describe('analyzeCompetition — el ruido no es señal', () => {
  it('una diferencia pequeña en puntaje es paridad, no ventaja', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', seo: 84 }),
      rivalesDe(sitio({ domain: 'a.com', seo: 86 })),
    )
    assert.equal(metrica(a, 'seo').stance, 'paridad')
  })

  it('una diferencia grande sí es señal', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', seo: 84 }),
      rivalesDe(sitio({ domain: 'a.com', seo: 99 })),
    )
    assert.equal(metrica(a, 'seo').stance, 'desventaja')
  })

  it('unos milisegundos de diferencia en el servidor son paridad', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', ttfb: 400 }),
      rivalesDe(sitio({ domain: 'a.com', ttfb: 320 })),
    )
    assert.equal(metrica(a, 'ttfb').stance, 'paridad')
  })
})

describe('analyzeCompetition — métricas donde menos es mejor', () => {
  it('el mejor servidor es el más rápido, no el de número mayor', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', ttfb: 167 }),
      rivalesDe(sitio({ domain: 'lento.com', ttfb: 2024 })),
    )
    const m = metrica(a, 'ttfb')
    assert.equal(m.rank, 1)
    assert.equal(m.bestDomain, 'mio.com')
  })

  it('menos imágenes sin alt es mejor posición', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', altPct: 79 }),
      rivalesDe(sitio({ domain: 'a.com', altPct: 10 })),
    )
    const m = metrica(a, 'altPct')
    assert.equal(m.rank, 2)
    assert.equal(m.bestDomain, 'a.com')
    assert.equal(m.stance, 'desventaja')
  })
})

describe('analyzeCompetition — resumen', () => {
  it('cuenta cada posición y calcula el puesto medio', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com' }),
      rivalesDe(sitio({ domain: 'a.com' }), sitio({ domain: 'b.com' })),
    )
    const suma = a.counts.ventaja + a.counts.paridad + a.counts.desventaja + a.counts['territorio-libre']
    assert.equal(suma, a.metrics.length)
    assert.equal(a.averageRank >= 1 && a.averageRank <= 3, true)
  })

  it('el titular señala el territorio libre cuando hay varios', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', internalLinks: 3, words: 200 }),
      rivalesDe(sitio({ domain: 'a.com', internalLinks: 5, words: 300 })),
    )
    assert.equal(/nadie/i.test(a.headline), true)
  })

  it('funciona sin competidores: todo queda en primera posición', () => {
    const a = analyzeCompetition(sitio({ domain: 'mio.com' }), [])
    assert.equal(a.metrics.every(m => m.rank === 1), true)
    assert.equal(a.averageRank, 1)
  })

  it('cada métrica trae lectura y acción redactadas', () => {
    const a = analyzeCompetition(sitio({ domain: 'mio.com' }), rivalesDe(sitio({ domain: 'a.com' })))
    for (const m of a.metrics) {
      assert.equal(m.reading.length > 15, true, m.key)
      assert.equal(m.action.length > 20, true, m.key)
    }
  })
})

describe('byPriority', () => {
  it('pone delante lo accionable: territorio libre antes que paridad', () => {
    const a = analyzeCompetition(
      sitio({ domain: 'mio.com', internalLinks: 3, seo: 84 }),
      rivalesDe(sitio({ domain: 'a.com', internalLinks: 5, seo: 86 })),
    )
    const orden = [...a.metrics].sort(byPriority)
    assert.equal(orden[0].stance, 'territorio-libre')
    assert.equal(orden[orden.length - 1].stance === 'paridad' || orden[orden.length - 1].stance === 'ventaja', true)
  })
})
