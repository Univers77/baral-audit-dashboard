export type LinkKind = 'internal' | 'external' | 'ignored'

export interface LinkClassification {
  kind: LinkKind
  /** URL absoluta normalizada, solo cuando kind !== 'ignored' */
  absolute?: string
  /** origin + pathname sin barra final, para deduplicar páginas internas */
  clean?: string
}

/**
 * Decide si un enlace apunta dentro o fuera del dominio auditado.
 *
 * Vivía embebido en el escáner y comparaba con `href.includes(dominio)`, una
 * comparación de subcadena: auditando `ejemplo.com`, un enlace a
 * `not-ejemplo.com` se contaba como interno. Se extrae aquí como función pura
 * para poder fijarla con tests.
 *
 * @param href     valor crudo del atributo href
 * @param pageUrl  URL de la página que contiene el enlace (ya resuelta tras redirects)
 * @param domain   dominio auditado, sin `www.`
 */
export function classifyLink(href: string, pageUrl: string, domain: string): LinkClassification {
  if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) return { kind: 'ignored' }

  let abs: URL
  try {
    abs = new URL(href, pageUrl)
  } catch {
    return { kind: 'ignored' }
  }
  if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return { kind: 'ignored' }

  const host = abs.hostname.replace(/^www\./, '')
  // El dominio exacto o cualquier subdominio suyo cuentan como internos.
  const isInternal = host === domain || host.endsWith(`.${domain}`)

  return {
    kind: isInternal ? 'internal' : 'external',
    absolute: abs.toString(),
    clean: abs.origin + abs.pathname.replace(/\/$/, ''),
  }
}

/** Rutas que no aportan a la muestra visual: descargas y jerarquías muy profundas. */
export function isCapturablePage(absolute: string, pageOrigin: string): boolean {
  let u: URL
  try {
    u = new URL(absolute)
  } catch {
    return false
  }
  const clean = u.origin + u.pathname.replace(/\/$/, '')
  if (clean === pageOrigin) return false                                  // la portada se captura aparte
  if (/\.(pdf|jpe?g|png|gif|svg|zip|docx?|xlsx?)$/i.test(u.pathname)) return false
  if (u.pathname.split('/').filter(Boolean).length > 2) return false      // evita rutas muy profundas
  return true
}
