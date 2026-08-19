import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isCurrentShape } from '@/lib/scanner/restore'

/**
 * Regresión real: al ampliar AuditResult con agentReadiness y coverage, los
 * resultados que los visitantes ya tenían guardados en el navegador quedaron
 * incompletos. La interfaz los consumía sin protección y la página entera
 * mostraba «Algo salió mal» al cargar, sin que el visitante pudiera saber por
 * qué ni recuperarse.
 *
 * Estos tests fijan la frontera. Al añadir un campo nuevo que la interfaz
 * consuma, añadirlo también a isCurrentShape y a este fixture.
 */

function completo(): Record<string, unknown> {
  return {
    domain: 'ejemplo.com',
    url: 'https://ejemplo.com/',
    scanDate: '2026-08-19T00:00:00.000Z',
    scores: { overall: 70, performance: 80, seo: 60, accessibility: 70, conversion: 65 },
    findings: [],
    compactFindings: [],
    tech: [],
    raw: { ttfb: 200 },
    agentReadiness: { score: 40, coverage: { run: 7, total: 7 }, bots: [], blockedCount: 0, checks: [] },
    coverage: { pillars: [{ key: 'seo', label: 'SEO', run: 8, total: 12, note: 'x' }], overallPct: 27 },
  }
}

describe('isCurrentShape — acepta lo utilizable', () => {
  it('acepta un resultado completo', () => {
    assert.equal(isCurrentShape(completo()), true)
  })
})

describe('isCurrentShape — rechaza lo que rompería el render', () => {
  it('rechaza un resultado sin agentReadiness', () => {
    const r = completo()
    delete r.agentReadiness
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza un resultado sin coverage', () => {
    const r = completo()
    delete r.coverage
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza coverage sin pillars', () => {
    const r = completo()
    r.coverage = { overallPct: 27 }
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza pillars que no es un array', () => {
    const r = completo()
    r.coverage = { pillars: 'no es un array', overallPct: 27 }
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza findings que no es un array', () => {
    const r = completo()
    r.findings = null
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza si falta el dominio', () => {
    const r = completo()
    delete r.domain
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza si falta la url', () => {
    const r = completo()
    delete r.url
    assert.equal(isCurrentShape(r), false)
  })

  it('rechaza si faltan los puntajes', () => {
    const r = completo()
    delete r.scores
    assert.equal(isCurrentShape(r), false)
  })
})

describe('isCurrentShape — entradas degradadas', () => {
  it('rechaza null y undefined sin lanzar', () => {
    assert.equal(isCurrentShape(null), false)
    assert.equal(isCurrentShape(undefined), false)
  })

  it('rechaza tipos primitivos', () => {
    assert.equal(isCurrentShape('texto'), false)
    assert.equal(isCurrentShape(42), false)
    assert.equal(isCurrentShape(true), false)
  })

  it('rechaza un objeto vacío', () => {
    assert.equal(isCurrentShape({}), false)
  })

  it('rechaza un array', () => {
    assert.equal(isCurrentShape([]), false)
  })
})
