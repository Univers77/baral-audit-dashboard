import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { auditSecurityHeaders, detectHeaderLeaks, headerScore } from '@/lib/scanner/headers'

const COMPLETO = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'content-security-policy': "default-src 'self'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'geolocation=()',
}

describe('auditSecurityHeaders', () => {
  it('detecta todas las cabeceras presentes', () => {
    const checks = auditSecurityHeaders(COMPLETO, true)
    assert.equal(checks.every(c => c.present), true)
    assert.equal(checks.length, 6)
  })

  it('detecta todas las ausentes', () => {
    const checks = auditSecurityHeaders({}, true)
    assert.equal(checks.every(c => !c.present), true)
  })

  it('omite HSTS en sitios sin HTTPS, donde no aplica', () => {
    const checks = auditSecurityHeaders({}, false)
    assert.equal(checks.some(c => c.key === 'strict-transport-security'), false)
    assert.equal(checks.length, 5)
  })

  it('compara los nombres sin distinguir mayúsculas', () => {
    const checks = auditSecurityHeaders({ 'Strict-Transport-Security': 'max-age=1' }, true)
    const hsts = checks.find(c => c.key === 'strict-transport-security')
    assert.equal(hsts?.present, true)
    assert.equal(hsts?.value, 'max-age=1')
  })

  it('cada chequeo trae fuente citable y explicación', () => {
    for (const c of auditSecurityHeaders({}, true)) {
      assert.equal(c.source.length > 0, true)
      assert.equal(c.why.length > 20, true)
    }
  })
})

describe('detectHeaderLeaks', () => {
  it('detecta X-Powered-By', () => {
    const leaks = detectHeaderLeaks({ 'x-powered-by': 'PHP/8.1.2' })
    assert.equal(leaks.length, 1)
    assert.equal(leaks[0].value, 'PHP/8.1.2')
  })

  it('marca Server solo cuando revela versión', () => {
    assert.equal(detectHeaderLeaks({ server: 'nginx/1.18.0' }).length, 1)
    assert.equal(detectHeaderLeaks({ server: 'nginx' }).length, 0)
    assert.equal(detectHeaderLeaks({ server: 'cloudflare' }).length, 0)
  })

  it('no reporta nada cuando no hay fugas', () => {
    assert.deepEqual(detectHeaderLeaks(COMPLETO), [])
  })
})

describe('headerScore', () => {
  it('da 100 con todas las cabeceras presentes', () => {
    assert.equal(headerScore(auditSecurityHeaders(COMPLETO, true)), 100)
  })

  it('da 0 sin ninguna', () => {
    assert.equal(headerScore(auditSecurityHeaders({}, true)), 0)
  })

  it('pondera: HSTS pesa más que Referrer-Policy', () => {
    const soloHsts = headerScore(auditSecurityHeaders({ 'strict-transport-security': 'max-age=1' }, true))
    const soloReferrer = headerScore(auditSecurityHeaders({ 'referrer-policy': 'no-referrer' }, true))
    assert.equal(soloHsts > soloReferrer, true)
  })

  it('no divide por cero con una lista vacía', () => {
    assert.equal(headerScore([]), 0)
  })
})
