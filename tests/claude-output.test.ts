import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseEnrichment } from '@/lib/scanner/claude-analyzer'

/**
 * La salida del modelo es entrada no confiable: puede venir incompleta, con
 * tipos distintos a los pedidos, envuelta en markdown o influida por el
 * contenido del sitio auditado. Nada de eso debe llegar al informe sin validar.
 */
describe('parseEnrichment — respuestas válidas', () => {
  const valida = JSON.stringify({
    executiveSummary: 'El sitio responde en 320 ms y obtiene 78 de 100.',
    topPriority: 'Corregir las 12 imágenes sin texto alternativo.',
    quickWins: ['Acortar el title a 60 caracteres', 'Añadir meta description'],
    strategicNote: 'La velocidad ya no es el cuello de botella.',
    criticalIssues: ['Faltan datos estructurados'],
    dataConfidence: 'ALTA',
  })

  it('acepta una respuesta bien formada', () => {
    const r = parseEnrichment(valida)
    assert.ok(r)
    assert.equal(r.dataConfidence, 'ALTA')
    assert.equal(r.quickWins.length, 2)
  })

  it('extrae el JSON aunque venga envuelto en markdown', () => {
    const r = parseEnrichment('```json\n' + valida + '\n```')
    assert.ok(r)
    assert.equal(r.executiveSummary.startsWith('El sitio responde'), true)
  })

  it('extrae el JSON aunque el modelo añada texto alrededor', () => {
    const r = parseEnrichment(`Aquí tienes el análisis:\n${valida}\nEspero que sirva.`)
    assert.ok(r)
  })
})

describe('parseEnrichment — respuestas que deben rechazarse', () => {
  it('rechaza texto sin JSON', () => {
    assert.equal(parseEnrichment('No puedo analizar este sitio.'), null)
  })

  it('rechaza JSON malformado', () => {
    assert.equal(parseEnrichment('{ "executiveSummary": "falta cierre"'), null)
  })

  it('rechaza si falta el resumen ejecutivo', () => {
    assert.equal(parseEnrichment(JSON.stringify({ topPriority: 'algo' })), null)
  })

  it('rechaza si el resumen viene vacío', () => {
    assert.equal(parseEnrichment(JSON.stringify({ executiveSummary: '   ' })), null)
  })
})

describe('parseEnrichment — normalización de campos', () => {
  it('degrada a BAJA una confianza fuera del enum', () => {
    const r = parseEnrichment(JSON.stringify({
      executiveSummary: 'Resumen válido.',
      dataConfidence: 'ABSOLUTA',
    }))
    assert.ok(r)
    assert.equal(r.dataConfidence, 'BAJA')
  })

  it('descarta elementos no textuales de las listas', () => {
    const r = parseEnrichment(JSON.stringify({
      executiveSummary: 'Resumen válido.',
      quickWins: ['válido', 42, null, { a: 1 }, '', '  ', 'otro válido'],
    }))
    assert.ok(r)
    assert.deepEqual(r.quickWins, ['válido', 'otro válido'])
  })

  it('convierte en lista vacía lo que no es un array', () => {
    const r = parseEnrichment(JSON.stringify({
      executiveSummary: 'Resumen válido.',
      quickWins: 'esto debería ser una lista',
    }))
    assert.ok(r)
    assert.deepEqual(r.quickWins, [])
  })

  it('completa con cadena vacía los campos de texto ausentes', () => {
    const r = parseEnrichment(JSON.stringify({ executiveSummary: 'Resumen válido.' }))
    assert.ok(r)
    assert.equal(r.topPriority, '')
    assert.equal(r.strategicNote, '')
  })
})
