/**
 * Agent-Readiness: ¿puede un agente de IA leer y operar este sitio?
 *
 * Es un eje distinto del SEO clásico. Un agente no ve el diseño: lee datos
 * estructurados, comprueba si el rastreador tiene permiso y necesita
 * formularios cuyos campos se identifiquen. Un sitio puede puntuar bien en SEO
 * y ser completamente opaco para un agente.
 *
 * Todos los chequeos son deterministas: mismo HTML, mismo resultado. Eso los
 * hace verificables con fixtures y detectables ante regresiones.
 */

import { agentAccess, type RobotsRules, type AgentAccess } from './robots'

/** Rastreadores de IA relevantes. Nombre tal como se declara en robots.txt. */
export const AI_AGENTS: { name: string; operator: string; purpose: string }[] = [
  { name: 'GPTBot',            operator: 'OpenAI',      purpose: 'Entrenamiento de modelos' },
  { name: 'OAI-SearchBot',     operator: 'OpenAI',      purpose: 'Índice de búsqueda de ChatGPT' },
  { name: 'ChatGPT-User',      operator: 'OpenAI',      purpose: 'Navegación en vivo durante una conversación' },
  { name: 'ClaudeBot',         operator: 'Anthropic',   purpose: 'Entrenamiento de modelos' },
  { name: 'Claude-User',       operator: 'Anthropic',   purpose: 'Navegación en vivo durante una conversación' },
  { name: 'PerplexityBot',     operator: 'Perplexity',  purpose: 'Índice de búsqueda' },
  { name: 'Google-Extended',   operator: 'Google',      purpose: 'Entrenamiento de Gemini' },
  { name: 'CCBot',             operator: 'Common Crawl', purpose: 'Corpus público usado por múltiples modelos' },
  { name: 'Applebot-Extended', operator: 'Apple',       purpose: 'Entrenamiento de Apple Intelligence' },
  { name: 'Bytespider',        operator: 'ByteDance',   purpose: 'Entrenamiento de modelos' },
]

export interface SchemaIdentity {
  type: string
  fields: string[]
}

export interface FormStats {
  formCount: number
  inputCount: number
  withName: number
  withAutocomplete: number
  withLabel: number
}

export interface AgentReadinessInput {
  statusCode: number
  wordCount: number
  scriptCount: number
  hasSpaRoot: boolean
  canonical: string | null
  /** null si el sitio no tiene robots.txt */
  robots: RobotsRules | null
  schemaIdentity: SchemaIdentity[]
  /** null si no existe; cadena vacía si existe pero está vacío */
  llmsTxt: string | null
  wellKnown: { aiPlugin: boolean; mcp: boolean }
  forms: FormStats
}

export interface AgentCheck {
  key: string
  label: string
  /** null = no se pudo evaluar. NO cuenta como aprobado. */
  pass: boolean | null
  detail: string
  why: string
  source: string
  weight: number
  /** informativa: se muestra pero no puntúa */
  informative?: boolean
}

export interface BotVerdict {
  name: string
  operator: string
  purpose: string
  access: AgentAccess
  via: string | null
}

export interface AgentReadiness {
  score: number
  coverage: { run: number; total: number }
  bots: BotVerdict[]
  blockedCount: number
  checks: AgentCheck[]
}

const SCHEMA_ORG = 'Schema.org · Organization / LocalBusiness'
const RFC_9309 = 'RFC 9309 · Robots Exclusion Protocol'
const WCAG_LABELS = 'WCAG 2.2 §3.3.2 · Etiquetas o instrucciones'

const IDENTITY_TYPES = ['organization', 'localbusiness', 'corporation', 'store', 'professionalservice']
const CONTACT_FIELDS = ['openinghours', 'openinghoursspecification', 'contactpoint', 'email', 'telephone']

/** Umbral por debajo del cual el contenido servido se considera insuficiente. */
const MIN_SERVER_WORDS = 200

export function words(n: number): string {
  return `${n} ${n === 1 ? 'palabra' : 'palabras'}`
}

function evaluateBots(robots: RobotsRules | null): BotVerdict[] {
  return AI_AGENTS.map(a => {
    if (!robots) {
      // Sin robots.txt todo está permitido por defecto, pero nada está declarado.
      return { ...a, access: 'unspecified' as AgentAccess, via: null }
    }
    const v = agentAccess(robots, a.name)
    return { ...a, access: v.access, via: v.via }
  })
}

function identityCheck(schema: SchemaIdentity[]): AgentCheck {
  const node = schema.find(s => IDENTITY_TYPES.includes(s.type.toLowerCase()))

  if (!node) {
    return {
      key: 'schema-identity',
      label: 'Identidad legible por máquina',
      pass: false,
      detail: schema.length
        ? `Hay datos estructurados pero ninguno de tipo Organization o LocalBusiness (se encontró: ${schema.map(s => s.type).slice(0, 4).join(', ')})`
        : 'No hay datos estructurados de identidad',
      why: 'Un agente que compara proveedores lee el nombre, la dirección y el teléfono desde los datos estructurados. Si solo están en el diseño de la página, para el agente no existen.',
      source: SCHEMA_ORG,
      weight: 20,
    }
  }

  const fields = node.fields.map(f => f.toLowerCase())
  const required = ['name', 'address', 'telephone']
  const missing = required.filter(r => !fields.includes(r))

  return {
    key: 'schema-identity',
    label: 'Identidad legible por máquina',
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `${node.type} con nombre, dirección y teléfono`
      : `${node.type} presente pero falta: ${missing.join(', ')}`,
    why: 'Un agente que compara proveedores lee el nombre, la dirección y el teléfono desde los datos estructurados. Si solo están en el diseño de la página, para el agente no existen.',
    source: SCHEMA_ORG,
    weight: 20,
  }
}

function contactCheck(schema: SchemaIdentity[]): AgentCheck {
  const has = schema.some(s => s.fields.some(f => CONTACT_FIELDS.includes(f.toLowerCase())))
  return {
    key: 'schema-contact',
    label: 'Contacto y horarios estructurados',
    pass: has,
    detail: has
      ? 'Declara horarios o punto de contacto en datos estructurados'
      : 'Sin horarios ni punto de contacto en datos estructurados',
    why: 'Es lo que permite a un agente responder "¿está abierto?" o "¿cómo los contacto?" sin que una persona lea la página.',
    source: SCHEMA_ORG,
    weight: 10,
  }
}

function serverRenderedCheck(i: AgentReadinessInput): AgentCheck {
  // El escáner NO ejecuta JavaScript, igual que la mayoría de rastreadores de
  // IA. Poco texto servido + muchos scripts + raíz de SPA significa que el
  // contenido se monta en el cliente y el agente ve una página vacía.
  const suspect = i.wordCount < MIN_SERVER_WORDS && (i.hasSpaRoot || i.scriptCount >= 5)

  return {
    key: 'server-rendered',
    label: 'Contenido visible sin ejecutar JavaScript',
    pass: !suspect,
    detail: suspect
      ? `Solo ${words(i.wordCount)} en el HTML servido con ${i.scriptCount} scripts${i.hasSpaRoot ? ' y raíz de aplicación cliente' : ''}: el contenido se monta en el navegador`
      : `${words(i.wordCount)} presentes en el HTML servido`,
    why: 'La mayoría de los rastreadores de IA no ejecutan JavaScript. Si el contenido se monta en el navegador, el agente recibe una página en blanco aunque una persona la vea completa.',
    source: 'Google Search Central · Renderizado y rastreo',
    weight: 20,
  }
}

function formsCheck(f: FormStats): AgentCheck {
  const base = {
    key: 'forms-semantic',
    label: 'Formularios operables por un agente',
    why: 'Un agente completa un formulario identificando cada campo por su atributo name y su etiqueta. Sin eso no puede rellenarlo, aunque una persona sí pueda.',
    source: WCAG_LABELS,
    weight: 15,
  }

  // Sin formularios el chequeo no aplica: no es un aprobado.
  if (f.formCount === 0 || f.inputCount === 0) {
    return { ...base, pass: null, detail: 'La página no tiene formularios que evaluar' }
  }

  const namedPct = f.withName / f.inputCount
  const labelPct = f.withLabel / f.inputCount
  const pass = namedPct >= 0.9 && labelPct >= 0.9

  return {
    ...base,
    pass,
    detail: `${f.inputCount} campos en ${f.formCount} formulario(s): ${f.withName} con name, ${f.withLabel} con etiqueta, ${f.withAutocomplete} con autocomplete`,
  }
}

export function computeAgentReadiness(i: AgentReadinessInput): AgentReadiness {
  const bots = evaluateBots(i.robots)
  const blocked = bots.filter(b => b.access === 'blocked')

  const botsCheck: AgentCheck = {
    key: 'bots-access',
    label: 'Acceso de rastreadores de IA',
    pass: blocked.length === 0,
    detail: blocked.length === 0
      ? i.robots
        ? 'Ningún rastreador de IA está bloqueado en robots.txt'
        : 'Sin robots.txt: todo permitido por omisión, nada declarado'
      : `Bloqueados: ${blocked.map(b => b.name).join(', ')}`,
    why: 'Un rastreador bloqueado no puede citar el sitio. Es el canal de mayor crecimiento y la causa más frecuente de invisibilidad involuntaria en respuestas de IA.',
    source: RFC_9309,
    weight: 25,
  }

  const canonicalCheck: AgentCheck = {
    key: 'canonical',
    label: 'URL canónica declarada',
    pass: !!i.canonical,
    detail: i.canonical ? i.canonical : 'Sin etiqueta canonical',
    why: 'Da al agente una dirección estable a la que volver y con la que citar, en lugar de la URL con parámetros por la que llegó.',
    source: 'Google Search Central · Canonicalización',
    weight: 5,
  }

  const llmsCheck: AgentCheck = {
    key: 'llms-txt',
    label: 'llms.txt con contenido',
    pass: i.llmsTxt !== null && i.llmsTxt.trim().length > 0,
    detail: i.llmsTxt === null
      ? 'No existe'
      : i.llmsTxt.trim().length === 0
        ? 'Existe pero está vacío'
        : `${i.llmsTxt.trim().split(/\r?\n/).length} líneas`,
    // Precisión deliberada: la guía oficial de Google de mayo de 2026 declara
    // que llms.txt NO es necesario para visibilidad en búsqueda generativa. Los
    // checklists de proveedores lo presentan como requisito porque venden
    // auditorías. Aquí puntúa poco y se etiqueta como señal complementaria.
    why: 'Señal complementaria, no requisito: Google declaró en mayo de 2026 que no es necesaria para la búsqueda generativa. Suma cuando existe, pero su ausencia no bloquea nada.',
    source: 'Propuesta llms.txt · adopción parcial',
    weight: 5,
  }

  const wellKnownCheck: AgentCheck = {
    key: 'well-known',
    label: 'Descubrimiento en /.well-known/',
    pass: i.wellKnown.aiPlugin || i.wellKnown.mcp,
    detail: [
      i.wellKnown.aiPlugin ? 'ai-plugin.json' : null,
      i.wellKnown.mcp ? 'mcp.json' : null,
    ].filter(Boolean).join(', ') || 'Sin manifiestos de agente publicados',
    why: 'Nivel avanzado: permite que un agente descubra por sí mismo qué operaciones ofrece el sitio. Muy poco adoptado todavía, por eso es informativo y no puntúa.',
    source: 'RFC 8615 · Well-Known URIs',
    weight: 0,
    informative: true,
  }

  const checks: AgentCheck[] = [
    botsCheck,
    serverRenderedCheck(i),
    identityCheck(i.schemaIdentity),
    formsCheck(i.forms),
    contactCheck(i.schemaIdentity),
    canonicalCheck,
    llmsCheck,
    wellKnownCheck,
  ]

  // Los chequeos que no se pudieron evaluar salen del numerador Y del
  // denominador. Nunca se cuentan como aprobados.
  const scored = checks.filter(c => c.weight > 0 && c.pass !== null)
  const totalWeight = scored.reduce((a, c) => a + c.weight, 0)
  const gotWeight = scored.reduce((a, c) => a + (c.pass ? c.weight : 0), 0)

  return {
    score: totalWeight === 0 ? 0 : Math.round((gotWeight / totalWeight) * 100),
    coverage: { run: scored.length, total: checks.filter(c => c.weight > 0).length },
    bots,
    blockedCount: blocked.length,
    checks,
  }
}
