/**
 * Parseo de robots.txt según RFC 9309.
 *
 * El archivo ya se descargaba para comprobar que existiera y se descartaba el
 * contenido. Leerlo permite responder la pregunta que hoy nadie mide: ¿este
 * sitio está bloqueando a los rastreadores de IA sin saberlo?
 */

export interface RobotsGroup {
  agents: string[]
  allow: string[]
  disallow: string[]
}

export interface RobotsRules {
  groups: RobotsGroup[]
  sitemaps: string[]
  /** true si el archivo existe pero no declara ninguna regla utilizable */
  empty: boolean
}

export type AgentAccess = 'allowed' | 'blocked' | 'unspecified'

export interface AgentVerdict {
  access: AgentAccess
  /** qué grupo decidió: el nombre del user-agent, '*', o null si ninguno */
  via: string | null
}

const EMPTY: RobotsRules = { groups: [], sitemaps: [], empty: true }

export function parseRobots(text: string): RobotsRules {
  if (!text || !text.trim()) return EMPTY

  const groups: RobotsGroup[] = []
  const sitemaps: string[] = []
  let current: RobotsGroup | null = null
  // Varias líneas User-agent seguidas comparten un mismo bloque de reglas.
  // Al llegar la primera regla el grupo se cierra y el siguiente User-agent
  // abre uno nuevo.
  let acceptingAgents = false

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue

    const sep = line.indexOf(':')
    if (sep === -1) continue

    const field = line.slice(0, sep).trim().toLowerCase()
    const value = line.slice(sep + 1).trim()

    if (field === 'sitemap') {
      if (value) sitemaps.push(value)
      continue
    }

    if (field === 'user-agent') {
      if (!value) continue
      if (current && acceptingAgents) {
        current.agents.push(value)
      } else {
        current = { agents: [value], allow: [], disallow: [] }
        groups.push(current)
        acceptingAgents = true
      }
      continue
    }

    if (field === 'allow' || field === 'disallow') {
      if (!current) continue
      acceptingAgents = false
      // "Disallow:" vacío significa permitir todo; no es una ruta.
      if (field === 'disallow' && value === '') continue
      if (value) current[field].push(value)
    }
  }

  return { groups, sitemaps, empty: groups.length === 0 && sitemaps.length === 0 }
}

/**
 * Convierte un patrón de robots.txt en expresión regular.
 * `*` es comodín de cualquier longitud; `$` ancla el final.
 */
function patternToRegex(pattern: string): RegExp {
  const anchored = pattern.endsWith('$')
  const body = anchored ? pattern.slice(0, -1) : pattern
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}${anchored ? '$' : ''}`)
}

/** Longitud del patrón que coincide, o -1 si no coincide. RFC 9309: gana el más largo. */
function matchLength(patterns: string[], path: string): number {
  let best = -1
  for (const p of patterns) {
    if (!patternToRegex(p).test(path)) continue
    if (p.length > best) best = p.length
  }
  return best
}

function groupFor(rules: RobotsRules, ua: string): { group: RobotsGroup; name: string } | null {
  const target = ua.toLowerCase()
  let wildcard: RobotsGroup | null = null

  for (const g of rules.groups) {
    for (const a of g.agents) {
      const name = a.toLowerCase()
      if (name === '*') { wildcard ??= g; continue }
      // RFC 9309: la comparación es por prefijo insensible a mayúsculas.
      if (target === name || target.startsWith(name)) return { group: g, name: a }
    }
  }

  return wildcard ? { group: wildcard, name: '*' } : null
}

/**
 * Determina si un user-agent puede rastrear una ruta.
 *
 * `unspecified` significa que el archivo no dice nada sobre este agente: por
 * defecto puede rastrear, pero el sitio no lo declaró de forma explícita.
 */
export function agentAccess(rules: RobotsRules, ua: string, path = '/'): AgentVerdict {
  const match = groupFor(rules, ua)
  if (!match) return { access: 'unspecified', via: null }

  const allowLen = matchLength(match.group.allow, path)
  const disallowLen = matchLength(match.group.disallow, path)

  if (disallowLen === -1) return { access: 'allowed', via: match.name }
  // Empate a favor de Allow, según RFC 9309.
  if (allowLen >= disallowLen) return { access: 'allowed', via: match.name }
  return { access: 'blocked', via: match.name }
}
