import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyLink, isCapturablePage } from '@/lib/scanner/links'

const PAGE = 'https://ejemplo.com/'
const DOMAIN = 'ejemplo.com'

describe('classifyLink — internos', () => {
  it('cuenta una ruta relativa como interna', () => {
    assert.equal(classifyLink('/servicios', PAGE, DOMAIN).kind, 'internal')
  })

  it('cuenta el dominio absoluto como interno', () => {
    assert.equal(classifyLink('https://ejemplo.com/contacto', PAGE, DOMAIN).kind, 'internal')
  })

  it('trata www como el mismo dominio', () => {
    assert.equal(classifyLink('https://www.ejemplo.com/blog', PAGE, DOMAIN).kind, 'internal')
  })

  it('cuenta un subdominio como interno', () => {
    assert.equal(classifyLink('https://blog.ejemplo.com/post', PAGE, DOMAIN).kind, 'internal')
  })
})

describe('classifyLink — externos', () => {
  it('cuenta otro dominio como externo', () => {
    assert.equal(classifyLink('https://google.com', PAGE, DOMAIN).kind, 'external')
  })

  // Este es el fallo que motivó extraer la función: la comparación anterior
  // usaba `href.includes(dominio)` y daba estos enlaces por internos.
  it('no confunde un dominio que contiene al auditado como subcadena', () => {
    assert.equal(classifyLink('https://not-ejemplo.com/', PAGE, DOMAIN).kind, 'external')
    assert.equal(classifyLink('https://ejemplo.com.attacker.net/', PAGE, DOMAIN).kind, 'external')
    assert.equal(classifyLink('https://miejemplo.com/', PAGE, DOMAIN).kind, 'external')
  })
})

describe('classifyLink — ignorados', () => {
  for (const href of ['mailto:hola@ejemplo.com', 'tel:+59170000000', 'javascript:void(0)', '#seccion', '']) {
    it(`ignora ${href || '(vacío)'}`, () => {
      assert.equal(classifyLink(href, PAGE, DOMAIN).kind, 'ignored')
    })
  }

  it('ignora protocolos que no son http/https', () => {
    assert.equal(classifyLink('ftp://ejemplo.com/archivo', PAGE, DOMAIN).kind, 'ignored')
  })
})

describe('isCapturablePage', () => {
  const origin = 'https://ejemplo.com'

  it('acepta una página interna normal', () => {
    assert.equal(isCapturablePage('https://ejemplo.com/servicios', origin), true)
  })

  it('descarta la portada, que ya se captura aparte', () => {
    assert.equal(isCapturablePage('https://ejemplo.com/', origin), false)
  })

  it('descarta descargas', () => {
    assert.equal(isCapturablePage('https://ejemplo.com/catalogo.pdf', origin), false)
    assert.equal(isCapturablePage('https://ejemplo.com/foto.jpg', origin), false)
  })

  it('descarta rutas demasiado profundas', () => {
    assert.equal(isCapturablePage('https://ejemplo.com/a/b/c/d', origin), false)
  })
})
