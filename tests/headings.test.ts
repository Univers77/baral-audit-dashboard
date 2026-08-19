import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { auditHeadings } from '@/lib/scanner/headings'

const h = (level: number, text: string) => ({ level, text })

describe('auditHeadings — estructura correcta', () => {
  it('acepta una jerarquía bien formada', () => {
    const r = auditHeadings([
      h(1, 'Título'), h(2, 'Sección'), h(3, 'Subsección'), h(2, 'Otra sección'),
    ])
    assert.equal(r.ok, true)
    assert.equal(r.skips.length, 0)
    assert.equal(r.h1Count, 1)
  })

  it('subir de nivel es válido: cierra una sección', () => {
    const r = auditHeadings([h(1, 'A'), h(2, 'B'), h(3, 'C'), h(2, 'D')])
    assert.deepEqual(r.skips, [])
  })
})

describe('auditHeadings — saltos de nivel', () => {
  it('detecta H2 seguido de H4', () => {
    const r = auditHeadings([h(1, 'A'), h(2, 'B'), h(4, 'Saltado')])
    assert.equal(r.skips.length, 1)
    assert.equal(r.skips[0].from, 2)
    assert.equal(r.skips[0].to, 4)
    assert.equal(r.skips[0].text, 'Saltado')
    assert.equal(r.ok, false)
  })

  it('detecta H1 seguido de H3', () => {
    const r = auditHeadings([h(1, 'A'), h(3, 'B')])
    assert.equal(r.skips.length, 1)
  })

  it('acumula varios saltos', () => {
    const r = auditHeadings([h(1, 'A'), h(3, 'B'), h(2, 'C'), h(5, 'D')])
    assert.equal(r.skips.length, 2)
  })

  it('los encabezados vacíos no rompen la continuidad de niveles', () => {
    // El H2 vacío se descarta; la secuencia real es H1 → H2, que es válida.
    const r = auditHeadings([h(1, 'A'), h(2, '   '), h(2, 'B')])
    assert.equal(r.skips.length, 0)
    assert.equal(r.emptyCount, 1)
  })
})

describe('auditHeadings — casos límite', () => {
  it('cuenta encabezados sin texto', () => {
    const r = auditHeadings([h(1, 'A'), h(2, ''), h(3, '  ')])
    assert.equal(r.emptyCount, 2)
    assert.equal(r.ok, false)
  })

  it('detecta un documento que no arranca en H1', () => {
    const r = auditHeadings([h(2, 'Empieza en H2'), h(3, 'Sub')])
    assert.equal(r.startsBelowH1, true)
    assert.equal(r.h1Count, 0)
    assert.equal(r.ok, false)
  })

  it('marca como incorrecto un documento con varios H1', () => {
    const r = auditHeadings([h(1, 'A'), h(1, 'B')])
    assert.equal(r.h1Count, 2)
    assert.equal(r.ok, false)
  })

  it('no rompe con una lista vacía', () => {
    const r = auditHeadings([])
    assert.equal(r.total, 0)
    assert.equal(r.skips.length, 0)
    assert.equal(r.startsBelowH1, false)
    assert.equal(r.ok, false) // sin H1 no puede estar bien
  })

  it('trunca el texto largo en el reporte del salto', () => {
    const r = auditHeadings([h(1, 'A'), h(3, 'x'.repeat(200))])
    assert.equal(r.skips[0].text.length, 80)
  })
})
