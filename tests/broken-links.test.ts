import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { confirmedBroken, verdictForStatus, type LinkCheck } from '@/lib/scanner/broken-links'

/**
 * El riesgo de esta comprobación no es dejar pasar un enlace roto: es afirmar
 * que algo está roto cuando no lo está. Un informe con falsos positivos deja de
 * usarse entero. Estos tests fijan esa frontera.
 */

describe('verdictForStatus — respuestas correctas', () => {
  for (const s of [200, 201, 204, 301, 302, 308, 399]) {
    it(`acepta ${s}`, () => {
      assert.equal(verdictForStatus(s).verdict, 'ok')
    })
  }
})

describe('verdictForStatus — rotos confirmados', () => {
  it('marca 404 como roto', () => {
    assert.equal(verdictForStatus(404).verdict, 'roto')
  })

  it('marca 410 como roto', () => {
    assert.equal(verdictForStatus(410).verdict, 'roto')
  })

  for (const s of [500, 502, 503, 504]) {
    it(`marca ${s} como roto`, () => {
      assert.equal(verdictForStatus(s).verdict, 'roto')
    })
  }

  it('el motivo cita el código devuelto', () => {
    assert.equal(verdictForStatus(404).reason.includes('404'), true)
  })
})

describe('verdictForStatus — lo que NO debe marcarse como roto', () => {
  // Este es el error más común de los escáneres de enlaces y la razón por la
  // que sus informes se vuelven ruido.
  it('401 es acceso restringido, no un enlace roto', () => {
    assert.equal(verdictForStatus(401).verdict, 'restringido')
  })

  it('403 es acceso restringido, no un enlace roto', () => {
    assert.equal(verdictForStatus(403).verdict, 'restringido')
  })

  it('429 es limitación de tasa, no un enlace roto', () => {
    assert.equal(verdictForStatus(429).verdict, 'restringido')
  })

  it('la ausencia de respuesta no se afirma como rota', () => {
    const r = verdictForStatus(null)
    assert.equal(r.verdict, 'sin-respuesta')
    assert.equal(r.reason.includes('automatizadas'), true)
  })
})

describe('confirmedBroken', () => {
  const checks: LinkCheck[] = [
    { url: 'https://a.com/1', kind: 'external', status: 404, verdict: 'roto', reason: '' },
    { url: 'https://a.com/2', kind: 'internal', status: 200, verdict: 'ok', reason: '' },
    { url: 'https://a.com/3', kind: 'external', status: 403, verdict: 'restringido', reason: '' },
    { url: 'https://a.com/4', kind: 'external', status: null, verdict: 'sin-respuesta', reason: '' },
    { url: 'https://a.com/5', kind: 'internal', status: 503, verdict: 'roto', reason: '' },
  ]

  it('devuelve solo los confirmados por el servidor', () => {
    const b = confirmedBroken(checks)
    assert.equal(b.length, 2)
    assert.deepEqual(b.map(c => c.url), ['https://a.com/1', 'https://a.com/5'])
  })

  it('excluye restringidos y sin respuesta', () => {
    const urls = confirmedBroken(checks).map(c => c.url)
    assert.equal(urls.includes('https://a.com/3'), false)
    assert.equal(urls.includes('https://a.com/4'), false)
  })

  it('no rompe con una lista vacía', () => {
    assert.deepEqual(confirmedBroken([]), [])
  })
})
