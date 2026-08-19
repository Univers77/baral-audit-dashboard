import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { agentAccess, parseRobots } from '@/lib/scanner/robots'

/**
 * robots.txt decide si un rastreador de IA puede citar el sitio. Un falso
 * "permitido" oculta invisibilidad real; un falso "bloqueado" hace perder
 * tiempo persiguiendo un problema inexistente. Ambos errores son caros.
 */

describe('parseRobots — estructura', () => {
  it('agrupa varios user-agent consecutivos bajo las mismas reglas', () => {
    const r = parseRobots(`
User-agent: GPTBot
User-agent: ClaudeBot
Disallow: /
    `)
    assert.equal(r.groups.length, 1)
    assert.deepEqual(r.groups[0].agents, ['GPTBot', 'ClaudeBot'])
    assert.deepEqual(r.groups[0].disallow, ['/'])
  })

  it('abre un grupo nuevo cuando el user-agent llega después de una regla', () => {
    const r = parseRobots(`
User-agent: *
Disallow: /admin
User-agent: GPTBot
Disallow: /
    `)
    assert.equal(r.groups.length, 2)
    assert.deepEqual(r.groups[1].agents, ['GPTBot'])
  })

  it('recoge los sitemaps declarados', () => {
    const r = parseRobots(`
Sitemap: https://ejemplo.com/sitemap.xml
Sitemap: https://ejemplo.com/news.xml
User-agent: *
Disallow:
    `)
    assert.deepEqual(r.sitemaps, ['https://ejemplo.com/sitemap.xml', 'https://ejemplo.com/news.xml'])
  })

  it('ignora comentarios y líneas sin separador', () => {
    const r = parseRobots(`
# esto es un comentario
User-agent: *   # comentario al final
Disallow: /privado
basura sin dos puntos
    `)
    assert.deepEqual(r.groups[0].disallow, ['/privado'])
  })

  it('trata un archivo vacío como sin reglas', () => {
    assert.equal(parseRobots('').empty, true)
    assert.equal(parseRobots('   \n  \n').empty, true)
  })

  it('un Disallow vacío no es una ruta prohibida', () => {
    const r = parseRobots('User-agent: *\nDisallow:')
    assert.deepEqual(r.groups[0].disallow, [])
  })
})

describe('agentAccess — decisión por agente', () => {
  it('bloquea al agente nombrado explícitamente', () => {
    const r = parseRobots('User-agent: GPTBot\nDisallow: /')
    const v = agentAccess(r, 'GPTBot')
    assert.equal(v.access, 'blocked')
    assert.equal(v.via, 'GPTBot')
  })

  it('el grupo específico gana sobre el comodín', () => {
    const r = parseRobots(`
User-agent: *
Disallow: /

User-agent: GPTBot
Allow: /
    `)
    assert.equal(agentAccess(r, 'GPTBot').access, 'allowed')
    assert.equal(agentAccess(r, 'PerplexityBot').access, 'blocked')
  })

  it('aplica el comodín cuando el agente no está nombrado', () => {
    const r = parseRobots('User-agent: *\nDisallow: /')
    const v = agentAccess(r, 'ClaudeBot')
    assert.equal(v.access, 'blocked')
    assert.equal(v.via, '*')
  })

  it('marca unspecified cuando nada aplica al agente', () => {
    const r = parseRobots('User-agent: Googlebot\nDisallow: /privado')
    const v = agentAccess(r, 'GPTBot')
    assert.equal(v.access, 'unspecified')
    assert.equal(v.via, null)
  })

  it('la comparación de user-agent no distingue mayúsculas', () => {
    const r = parseRobots('User-agent: gptbot\nDisallow: /')
    assert.equal(agentAccess(r, 'GPTBot').access, 'blocked')
  })

  it('permite la raíz cuando solo se prohíbe una subruta', () => {
    const r = parseRobots('User-agent: *\nDisallow: /admin')
    assert.equal(agentAccess(r, 'GPTBot', '/').access, 'allowed')
    assert.equal(agentAccess(r, 'GPTBot', '/admin/panel').access, 'blocked')
  })
})

describe('agentAccess — coincidencia de rutas (RFC 9309)', () => {
  it('gana el patrón más largo', () => {
    const r = parseRobots(`
User-agent: *
Disallow: /blog
Allow: /blog/publico
    `)
    assert.equal(agentAccess(r, 'GPTBot', '/blog/privado').access, 'blocked')
    assert.equal(agentAccess(r, 'GPTBot', '/blog/publico/post').access, 'allowed')
  })

  it('en empate gana Allow', () => {
    const r = parseRobots(`
User-agent: *
Disallow: /x
Allow: /x
    `)
    assert.equal(agentAccess(r, 'GPTBot', '/x').access, 'allowed')
  })

  it('interpreta el comodín *', () => {
    const r = parseRobots('User-agent: *\nDisallow: /*.pdf')
    assert.equal(agentAccess(r, 'GPTBot', '/docs/manual.pdf').access, 'blocked')
    assert.equal(agentAccess(r, 'GPTBot', '/docs/manual.html').access, 'allowed')
  })

  it('interpreta el ancla $ de fin de ruta', () => {
    const r = parseRobots('User-agent: *\nDisallow: /fin$')
    assert.equal(agentAccess(r, 'GPTBot', '/fin').access, 'blocked')
    assert.equal(agentAccess(r, 'GPTBot', '/fin/continua').access, 'allowed')
  })

  it('no confunde metacaracteres de regex en la ruta', () => {
    const r = parseRobots('User-agent: *\nDisallow: /precio(2026)')
    assert.equal(agentAccess(r, 'GPTBot', '/precio(2026)').access, 'blocked')
    assert.equal(agentAccess(r, 'GPTBot', '/precio2026').access, 'allowed')
  })
})
