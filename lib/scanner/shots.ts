import type { AuditResult, DeviceShots } from '@/lib/scanner/types'

const VIEWPORTS = {
  mobile:  { w: 390,  h: 844,  isMobile: true,  scale: 2 },
  tablet:  { w: 820,  h: 1180, isMobile: true,  scale: 2 },
  desktop: { w: 1440, h: 900,  isMobile: false, scale: 1 },
} as const

export function shotUrl(
  url: string,
  device: keyof typeof VIEWPORTS = 'desktop',
  opts: { fullPage?: boolean } = {},
): string {
  const d = VIEWPORTS[device]
  const p = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    'viewport.width': String(d.w),
    'viewport.height': String(d.h),
    'viewport.deviceScaleFactor': String(d.scale),
    'viewport.isMobile': String(d.isMobile),
    'viewport.hasTouch': String(d.isMobile),
    // waitForTimeout y NO waitUntil=networkidle0: en sitios con analytics o
    // polling la red nunca queda idle, la petición expira y el servicio
    // devuelve una imagen en blanco.
    waitForTimeout: '3500',
    type: 'jpeg',
    embed: 'screenshot.url',
  })
  if (opts.fullPage) p.set('screenshot.fullPage', 'true')
  return `https://api.microlink.io/?${p.toString()}`
}

/** Los tres viewports de una misma URL. */
export function deviceShots(url: string): DeviceShots {
  return {
    mobile: shotUrl(url, 'mobile'),
    tablet: shotUrl(url, 'tablet'),
    desktop: shotUrl(url, 'desktop'),
  }
}

/**
 * Resultados cacheados por versiones previas traen solo `screenshotUrl`.
 * Se derivan los tres viewports para que no se rompan.
 */
export function resolveShots(raw: AuditResult['raw']): DeviceShots | null {
  if (raw.screenshots?.desktop) return raw.screenshots
  if (!raw.url) return null
  return deviceShots(raw.url)
}

export interface PageShot {
  url: string
  /** etiqueta legible derivada de la ruta */
  label: string
  path: string
  shot: string
}

/** Nombre legible a partir de la ruta: /sobre-nosotros → "Sobre nosotros". */
function labelFor(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean).pop() ?? ''
  if (!seg) return 'Portada'
  return seg
    .replace(/\.(html?|php|aspx?)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
}

/**
 * Selecciona qué páginas capturar. Prioriza las rutas que suelen decidir una
 * contratación (servicios, portafolio, contacto, nosotros) sobre secciones
 * de bajo valor comercial (aviso legal, categorías del blog).
 */
const PRIORITY = [
  /servicio|producto|solucion|plan|precio|tarifa/i,
  /portafolio|portfolio|proyecto|caso|trabajo|cliente/i,
  /contacto|cotiza|presupuesto|demo|agenda/i,
  /nosotros|about|equipo|empresa|quienes/i,
  /blog|noticia|recurso/i,
]
const DEPRIORITY = /privacidad|cookie|terminos|legal|aviso|politica|login|acceso|carrito|checkout/i

export function selectPageShots(r: AuditResult, max = 3): PageShot[] {
  const home = r.raw.url
  const out: PageShot[] = [{
    url: home,
    label: 'Portada',
    path: '/',
    shot: r.raw.screenshots?.desktop ?? shotUrl(home, 'desktop'),
  }]

  const candidates = (r.raw.internalUrls ?? []).filter(u => !DEPRIORITY.test(u))
  const ranked = candidates
    .map(u => {
      const idx = PRIORITY.findIndex(re => re.test(u))
      return { u, rank: idx === -1 ? PRIORITY.length : idx }
    })
    .sort((a, b) => a.rank - b.rank)

  for (const { u } of ranked) {
    if (out.length >= max) break
    let path = '/'
    try { path = new URL(u).pathname || '/' } catch { continue }
    if (out.some(o => o.path === path)) continue
    out.push({ url: u, label: labelFor(path), path, shot: shotUrl(u, 'desktop') })
  }

  return out
}
