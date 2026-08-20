import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { attemptLabel, decideRetry, MAX_ATTEMPTS } from '@/lib/psi/retry'

/**
 * El riesgo de esta tabla es doble y en direcciones opuestas: reintentar lo que
 * nunca va a funcionar hace esperar de balde, y rendirse ante un fallo
 * pasajero deja al usuario con un error que se habría resuelto solo.
 */

describe('decideRetry — fallos pasajeros', () => {
  it('reintenta cuando no hubo respuesta', () => {
    const d = decideRetry(1, { network: true })
    assert.equal(d.retry, true)
    assert.equal(d.delayMs > 0, true)
  })

  it('reintenta ante un error de servidor', () => {
    for (const status of [500, 502, 503, 504]) {
      assert.equal(decideRetry(1, { status }).retry, true, `status ${status}`)
    }
  })

  it('espera más en el segundo intento que en el primero', () => {
    const primero = decideRetry(1, { network: true }).delayMs
    const segundo = decideRetry(2, { network: true }).delayMs
    assert.equal(segundo > primero, true)
  })

  it('cada decisión trae un motivo que mostrar', () => {
    assert.equal(decideRetry(1, { network: true }).reason.length > 10, true)
    assert.equal(decideRetry(1, { status: 503 }).reason.length > 10, true)
  })
})

describe('decideRetry — fallos definitivos', () => {
  it('no reintenta una petición mal formada', () => {
    assert.equal(decideRetry(1, { status: 400 }).retry, false)
  })

  it('no reintenta un problema de permisos', () => {
    assert.equal(decideRetry(1, { status: 403 }).retry, false)
  })

  it('no reintenta un 404', () => {
    assert.equal(decideRetry(1, { status: 404 }).retry, false)
  })
})

describe('decideRetry — límite de consultas', () => {
  it('reintenta una sola vez: puede ser el límite por minuto', () => {
    assert.equal(decideRetry(1, { status: 429 }).retry, true)
    assert.equal(decideRetry(2, { status: 429 }).retry, false)
  })

  it('trata igual la cuota declarada por la API', () => {
    assert.equal(decideRetry(1, { quota: true }).retry, true)
    assert.equal(decideRetry(2, { quota: true }).retry, false)
  })

  it('espera lo suficiente para que se renueve el límite por minuto', () => {
    assert.equal(decideRetry(1, { status: 429 }).delayMs >= 5_000, true)
  })
})

describe('decideRetry — tope de intentos', () => {
  it('se detiene al alcanzar el máximo, aunque el fallo sea pasajero', () => {
    assert.equal(decideRetry(MAX_ATTEMPTS, { network: true }).retry, false)
    assert.equal(decideRetry(MAX_ATTEMPTS, { status: 503 }).retry, false)
  })

  it('no reintenta más allá del máximo', () => {
    assert.equal(decideRetry(MAX_ATTEMPTS + 5, { network: true }).retry, false)
  })
})

describe('attemptLabel', () => {
  it('el primer intento no se anuncia como reintento', () => {
    assert.equal(/reintento/i.test(attemptLabel(1)), false)
  })

  it('los siguientes indican en qué intento van', () => {
    assert.equal(attemptLabel(2).includes('2'), true)
    assert.equal(attemptLabel(2).includes(String(MAX_ATTEMPTS)), true)
  })
})
