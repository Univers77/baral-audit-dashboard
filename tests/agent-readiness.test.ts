import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { AI_AGENTS, computeAgentReadiness, type AgentReadinessInput } from '@/lib/scanner/agent-readiness'
import { parseRobots } from '@/lib/scanner/robots'

/** Sitio bien preparado: sirve de base y cada test degrada un solo aspecto. */
function base(): AgentReadinessInput {
  return {
    statusCode: 200,
    wordCount: 1200,
    scriptCount: 3,
    hasSpaRoot: false,
    canonical: 'https://ejemplo.com/',
    robots: parseRobots('User-agent: *\nDisallow: /admin'),
    schemaIdentity: [
      { type: 'LocalBusiness', fields: ['name', 'address', 'telephone', 'openingHours'] },
    ],
    llmsTxt: '# Ejemplo\nSomos una empresa.',
    wellKnown: { aiPlugin: false, mcp: false },
    forms: { formCount: 1, inputCount: 4, withName: 4, withAutocomplete: 4, withLabel: 4 },
  }
}

const check = (r: ReturnType<typeof computeAgentReadiness>, key: string) =>
  r.checks.find(c => c.key === key)!

describe('computeAgentReadiness — acceso de rastreadores', () => {
  it('evalúa todos los agentes conocidos', () => {
    const r = computeAgentReadiness(base())
    assert.equal(r.bots.length, AI_AGENTS.length)
  })

  it('detecta un bloqueo por comodín', () => {
    const i = base()
    i.robots = parseRobots('User-agent: *\nDisallow: /')
    const r = computeAgentReadiness(i)
    assert.equal(r.blockedCount, AI_AGENTS.length)
    assert.equal(check(r, 'bots-access').pass, false)
  })

  it('detecta el bloqueo de un solo agente', () => {
    const i = base()
    i.robots = parseRobots('User-agent: GPTBot\nDisallow: /')
    const r = computeAgentReadiness(i)
    assert.equal(r.blockedCount, 1)
    assert.equal(r.bots.find(b => b.name === 'GPTBot')?.access, 'blocked')
    assert.equal(r.bots.find(b => b.name === 'ClaudeBot')?.access, 'unspecified')
  })

  it('sin robots.txt marca todo como no declarado, no como bloqueado', () => {
    const i = base()
    i.robots = null
    const r = computeAgentReadiness(i)
    assert.equal(r.blockedCount, 0)
    assert.equal(r.bots.every(b => b.access === 'unspecified'), true)
    assert.equal(check(r, 'bots-access').pass, true)
  })
})

describe('computeAgentReadiness — contenido servido', () => {
  it('aprueba cuando el HTML trae el contenido', () => {
    assert.equal(check(computeAgentReadiness(base()), 'server-rendered').pass, true)
  })

  it('detecta una aplicación montada en el navegador', () => {
    const i = base()
    i.wordCount = 12
    i.hasSpaRoot = true
    i.scriptCount = 14
    assert.equal(check(computeAgentReadiness(i), 'server-rendered').pass, false)
  })

  it('poco texto con muchos scripts basta como señal', () => {
    const i = base()
    i.wordCount = 40
    i.hasSpaRoot = false
    i.scriptCount = 9
    assert.equal(check(computeAgentReadiness(i), 'server-rendered').pass, false)
  })

  it('una página corta pero sin scripts no se marca como render en cliente', () => {
    const i = base()
    i.wordCount = 90
    i.scriptCount = 1
    i.hasSpaRoot = false
    assert.equal(check(computeAgentReadiness(i), 'server-rendered').pass, true)
  })
})

describe('computeAgentReadiness — identidad estructurada', () => {
  it('aprueba con nombre, dirección y teléfono', () => {
    assert.equal(check(computeAgentReadiness(base()), 'schema-identity').pass, true)
  })

  it('falla cuando falta un campo y lo nombra', () => {
    const i = base()
    i.schemaIdentity = [{ type: 'Organization', fields: ['name', 'address'] }]
    const c = check(computeAgentReadiness(i), 'schema-identity')
    assert.equal(c.pass, false)
    assert.equal(c.detail.includes('telephone'), true)
  })

  it('falla cuando hay schema pero de otro tipo', () => {
    const i = base()
    i.schemaIdentity = [{ type: 'WebPage', fields: ['name'] }]
    const c = check(computeAgentReadiness(i), 'schema-identity')
    assert.equal(c.pass, false)
    assert.equal(c.detail.includes('WebPage'), true)
  })

  it('falla sin ningún dato estructurado', () => {
    const i = base()
    i.schemaIdentity = []
    assert.equal(check(computeAgentReadiness(i), 'schema-identity').pass, false)
  })
})

describe('computeAgentReadiness — formularios', () => {
  it('sin formularios el chequeo no aplica y NO cuenta como aprobado', () => {
    const i = base()
    i.forms = { formCount: 0, inputCount: 0, withName: 0, withAutocomplete: 0, withLabel: 0 }
    const r = computeAgentReadiness(i)
    assert.equal(check(r, 'forms-semantic').pass, null)
    // Sale del denominador de cobertura en lugar de inflar el puntaje.
    assert.equal(r.coverage.run, r.coverage.total - 1)
  })

  it('falla cuando faltan etiquetas', () => {
    const i = base()
    i.forms = { formCount: 1, inputCount: 5, withName: 5, withAutocomplete: 0, withLabel: 1 }
    assert.equal(check(computeAgentReadiness(i), 'forms-semantic').pass, false)
  })

  it('falla cuando faltan atributos name', () => {
    const i = base()
    i.forms = { formCount: 1, inputCount: 5, withName: 1, withAutocomplete: 5, withLabel: 5 }
    assert.equal(check(computeAgentReadiness(i), 'forms-semantic').pass, false)
  })
})

describe('computeAgentReadiness — puntaje y cobertura', () => {
  it('un sitio bien preparado supera 90', () => {
    assert.equal(computeAgentReadiness(base()).score >= 90, true)
  })

  it('un sitio hostil a agentes queda muy bajo', () => {
    const r = computeAgentReadiness({
      statusCode: 200,
      wordCount: 5,
      scriptCount: 20,
      hasSpaRoot: true,
      canonical: null,
      robots: parseRobots('User-agent: *\nDisallow: /'),
      schemaIdentity: [],
      llmsTxt: null,
      wellKnown: { aiPlugin: false, mcp: false },
      forms: { formCount: 1, inputCount: 3, withName: 0, withAutocomplete: 0, withLabel: 0 },
    })
    assert.equal(r.score, 0)
    assert.equal(r.blockedCount, AI_AGENTS.length)
  })

  it('el bloqueo de rastreadores pesa más que llms.txt', () => {
    const sinBots = base()
    sinBots.robots = parseRobots('User-agent: *\nDisallow: /')
    const sinLlms = base()
    sinLlms.llmsTxt = null
    assert.equal(computeAgentReadiness(sinBots).score < computeAgentReadiness(sinLlms).score, true)
  })

  it('el chequeo de /.well-known/ es informativo y no altera el puntaje', () => {
    const con = base()
    con.wellKnown = { aiPlugin: true, mcp: true }
    assert.equal(computeAgentReadiness(con).score, computeAgentReadiness(base()).score)
    assert.equal(check(computeAgentReadiness(con), 'well-known').informative, true)
  })

  it('llms.txt vacío no cuenta como presente', () => {
    const i = base()
    i.llmsTxt = '   '
    assert.equal(check(computeAgentReadiness(i), 'llms-txt').pass, false)
  })

  it('el puntaje nunca sale del rango 0–100', () => {
    const r = computeAgentReadiness(base())
    assert.equal(r.score >= 0 && r.score <= 100, true)
  })
})
