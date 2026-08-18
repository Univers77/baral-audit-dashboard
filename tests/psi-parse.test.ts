import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatCwv, parsePsi } from '@/lib/psi/parse'

/** Respuesta mínima de PageSpeed v5 con los casos que importan. */
const fixture = {
  id: 'https://ejemplo.com/',
  analysisUTCTimestamp: '2026-08-18T20:00:00.000Z',
  loadingExperience: {
    metrics: {
      LARGEST_CONTENTFUL_PAINT_MS: {
        percentile: 3200,
        distributions: [
          { min: 0, max: 2500, proportion: 0.55 },
          { min: 2500, max: 4000, proportion: 0.3 },
          { min: 4000, proportion: 0.15 },
        ],
      },
      INTERACTION_TO_NEXT_PAINT: {
        percentile: 180,
        distributions: [
          { min: 0, max: 200, proportion: 0.78 },
          { min: 200, max: 500, proportion: 0.17 },
          { min: 500, proportion: 0.05 },
        ],
      },
      // CrUX entrega el CLS multiplicado por 100: 28 significa 0.28.
      CUMULATIVE_LAYOUT_SHIFT_SCORE: {
        percentile: 28,
        distributions: [
          { min: 0, max: 10, proportion: 0.62 },
          { min: 10, max: 25, proportion: 0.23 },
          { min: 25, proportion: 0.15 },
        ],
      },
    },
  },
  lighthouseResult: {
    requestedUrl: 'https://ejemplo.com/',
    finalUrl: 'https://ejemplo.com/',
    lighthouseVersion: '11.0.0',
    runWarnings: [],
    categories: {
      performance: { score: 0.42, auditRefs: [{ id: 'render-blocking-resources' }] },
      accessibility: { score: 0.81, auditRefs: [{ id: 'image-alt' }] },
      'best-practices': { score: 0.96, auditRefs: [{ id: 'errors-in-console' }] },
      seo: { score: 0.9, auditRefs: [{ id: 'meta-description' }] },
    },
    audits: {
      'render-blocking-resources': {
        score: 0.25,
        title: 'Elimina recursos que bloquean el renderizado',
        description: 'Bloquean el primer pintado. [Más información](https://web.dev/x/).',
        scoreDisplayMode: 'numeric',
        details: { type: 'opportunity', overallSavingsMs: 1850, overallSavingsBytes: 145000 },
      },
      'sin-ahorro': {
        score: 0.9,
        title: 'Oportunidad sin ahorro',
        description: 'No debe aparecer.',
        scoreDisplayMode: 'numeric',
        details: { type: 'opportunity', overallSavingsMs: 0, overallSavingsBytes: 0 },
      },
      'image-alt': { score: 0, title: 'Imágenes sin atributo alt', description: 'x', scoreDisplayMode: 'binary' },
      'meta-description': { score: 0, title: 'Falta meta description', description: 'x', scoreDisplayMode: 'binary' },
      'errors-in-console': { score: 1, title: 'Sin errores en consola', description: 'x', scoreDisplayMode: 'binary' },
      'audit-informativo': { score: 0, title: 'Informativo', description: 'x', scoreDisplayMode: 'informative' },
      'audit-na': { score: 0, title: 'No aplicable', description: 'x', scoreDisplayMode: 'notApplicable' },
      'total-byte-weight': { score: 0.6, numericValue: 2287616, title: 'Peso total', scoreDisplayMode: 'numeric' },
      'screenshot-thumbnails': {
        details: {
          items: [
            { timing: 500, data: 'AAAA' },
            { timing: 1000, data: 'data:image/jpeg;base64,BBBB' },
          ],
        },
      },
      'final-screenshot': { details: { data: 'CCCC' } },
    },
  },
}

describe('parsePsi — puntajes', () => {
  const r = parsePsi(fixture, 'mobile')

  it('convierte la escala 0-1 a 0-100', () => {
    assert.equal(r.scores.performance, 42)
    assert.equal(r.scores.accessibility, 81)
    assert.equal(r.scores.bestPractices, 96)
    assert.equal(r.scores.seo, 90)
  })
})

describe('parsePsi — datos de campo (CrUX)', () => {
  const r = parsePsi(fixture, 'mobile')
  const byKey = Object.fromEntries(r.field.metrics.map(m => [m.key, m]))

  it('marca los datos como disponibles', () => {
    assert.equal(r.field.available, true)
  })

  it('divide el CLS entre 100', () => {
    assert.equal(byKey.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile, 0.28)
  })

  it('clasifica cada métrica con los umbrales oficiales', () => {
    assert.equal(byKey.LARGEST_CONTENTFUL_PAINT_MS.verdict, 'mejorable')   // 3200 ms
    assert.equal(byKey.INTERACTION_TO_NEXT_PAINT.verdict, 'bueno')          // 180 ms
    assert.equal(byKey.CUMULATIVE_LAYOUT_SHIFT_SCORE.verdict, 'deficiente') // 0.28
  })

  it('el veredicto global lo determina la peor Core Web Vital', () => {
    assert.equal(r.field.overall, 'deficiente')
  })
})

describe('parsePsi — oportunidades', () => {
  const r = parsePsi(fixture, 'mobile')

  it('descarta las que no ahorran nada', () => {
    assert.equal(r.opportunities.length, 1)
    assert.equal(r.opportunities[0].key, 'render-blocking-resources')
  })

  it('limpia los enlaces markdown de la descripción', () => {
    assert.equal(/\[|\]\(/.test(r.opportunities[0].description), false)
  })
})

describe('parsePsi — auditorías no superadas', () => {
  const keys = parsePsi(fixture, 'mobile').failedAudits.map(a => a.key)

  it('incluye las que fallaron', () => {
    assert.equal(keys.includes('image-alt'), true)
    assert.equal(keys.includes('meta-description'), true)
  })

  it('excluye las aprobadas, informativas y no aplicables', () => {
    assert.equal(keys.includes('errors-in-console'), false)
    assert.equal(keys.includes('audit-informativo'), false)
    assert.equal(keys.includes('audit-na'), false)
  })
})

describe('parsePsi — capturas de carga', () => {
  const r = parsePsi(fixture, 'mobile')

  it('lee la tira de miniaturas en orden', () => {
    assert.equal(r.filmstrip.length, 2)
    assert.equal(r.filmstrip[0].timing, 500)
  })

  it('añade el prefijo data: cuando falta y lo respeta cuando ya viene', () => {
    assert.equal(r.filmstrip[0].data, 'data:image/jpeg;base64,AAAA')
    assert.equal(r.filmstrip[1].data, 'data:image/jpeg;base64,BBBB')
  })

  it('lee la captura final', () => {
    assert.equal(r.finalScreenshot, 'data:image/jpeg;base64,CCCC')
  })
})

describe('formatCwv', () => {
  it('usa segundos por encima de 1000 ms', () => {
    assert.equal(formatCwv({ percentile: 3200, unit: 'ms' }), '3.2 s')
  })
  it('usa milisegundos por debajo', () => {
    assert.equal(formatCwv({ percentile: 180, unit: 'ms' }), '180 ms')
  })
  it('usa dos decimales para el CLS', () => {
    assert.equal(formatCwv({ percentile: 0.28, unit: 'score' }), '0.28')
  })
})

describe('parsePsi — sin datos de campo', () => {
  it('no rompe cuando CrUX no devuelve métricas', () => {
    const sinCampo = { ...fixture, loadingExperience: undefined }
    const r = parsePsi(sinCampo, 'desktop')
    assert.equal(r.field.available, false)
    assert.equal(r.field.overall, 'sin-datos')
    assert.equal(r.scores.performance, 42) // el laboratorio sigue disponible
  })
})
