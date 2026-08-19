import * as cheerio from 'cheerio'
import { safeFetchOk, safeFetchText, UnsafeUrlError } from '@/lib/security/safe-remote-fetch'
import { checkLinks, confirmedBroken, MAX_LINKS_CHECKED, type LinkTarget } from './broken-links'
import { classifyLink, isCapturablePage } from './links'
import { parseSitemap } from './sitemap'
import type { FormStats, SchemaIdentity } from './agent-readiness'
import type { RawScan, ScanError, DeviceShots } from './types'

const UA = 'Mozilla/5.0 (compatible; MasterWebAuditor/2.0; +https://baralintegral.com)'

// Viewports reales de dispositivo. isMobile/hasTouch hacen que el navegador
// headless mande UA móvil y active los media queries del sitio — sin esto las
// tres capturas saldrían idénticas al layout de escritorio.
const DEVICE_VIEWPORTS = {
  mobile:  { width: 390,  height: 844,  isMobile: true,  scale: 2 },
  tablet:  { width: 820,  height: 1180, isMobile: true,  scale: 2 },
  desktop: { width: 1440, height: 900,  isMobile: false, scale: 1 },
} as const

function deviceShotUrl(url: string, d: (typeof DEVICE_VIEWPORTS)[keyof typeof DEVICE_VIEWPORTS]): string {
  const p = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    'viewport.width': String(d.width),
    'viewport.height': String(d.height),
    'viewport.deviceScaleFactor': String(d.scale),
    'viewport.isMobile': String(d.isMobile),
    'viewport.hasTouch': String(d.isMobile),
    // waitForTimeout deja que corran animaciones y lazy-load de hero.
    // NO usar waitUntil=networkidle0: en sitios con polling/analytics nunca
    // alcanza el idle, expira y devuelve una imagen en blanco.
    waitForTimeout: '3500',
    type: 'jpeg',
    embed: 'screenshot.url',
  })
  return `https://api.microlink.io/?${p.toString()}`
}

function buildDeviceShots(url: string): DeviceShots {
  return {
    mobile:  deviceShotUrl(url, DEVICE_VIEWPORTS.mobile),
    tablet:  deviceShotUrl(url, DEVICE_VIEWPORTS.tablet),
    desktop: deviceShotUrl(url, DEVICE_VIEWPORTS.desktop),
  }
}

/**
 * Detección de stack sobre el HTML COMPLETO.
 * Antes esto vivía en el analyzer y miraba htmlSnippet (2 000 caracteres):
 * gtag, GTM y la mayoría de plugins se declaran mucho más abajo del <head>,
 * así que el informe reportaba "1 tecnología · sin analítica" en sitios con
 * Analytics claramente instalado.
 */
const TECH_PATTERNS: { label: string; re: RegExp; crit?: boolean }[] = [
  { label: 'WordPress',            re: /wp-content|wp-includes|wp-json/i },
  { label: 'Elementor',            re: /elementor/i },
  { label: 'Astra',                re: /astra-theme|themes\/astra/i },
  { label: 'Spectra',              re: /spectra|ultimate-addons/i },
  // Exige el plugin real. Un /woocommerce/ suelto da falso positivo: Elementor
  // incluye reglas CSS .woocommerce en su hoja de estilos aunque el plugin no
  // esté instalado.
  { label: 'WooCommerce',          re: /plugins\/woocommerce\/|woocommerce-js|wc-add-to-cart/i },
  { label: 'Shopify',              re: /cdn\.shopify|shopify\.com/i },
  { label: 'Wix',                  re: /wix\.com|wixstatic/i },
  { label: 'Squarespace',          re: /squarespace/i },
  { label: 'Webflow',              re: /webflow/i },
  { label: 'Next.js',              re: /_next\/static|__NEXT_DATA__/i },
  // wp-includes/js/dist/vendor/react.min.js lo carga WordPress para Gutenberg:
  // no es una decisión de arquitectura del sitio y se excluye más abajo.
  { label: 'React',                re: /react(-dom)?[.@]|data-reactroot/i },
  { label: 'Vue.js',               re: /vue(\.min)?\.js|data-v-[0-9a-f]{8}/i },
  { label: 'jQuery',               re: /jquery[.-]/i },
  { label: 'Bootstrap',            re: /bootstrap(\.min)?\.(css|js)/i },
  { label: 'Font Awesome',         re: /font-?awesome/i },
  { label: 'Google Analytics 4',   re: /gtag\/js|googletagmanager\.com\/gtag|G-[A-Z0-9]{8,}/i },
  { label: 'Google Tag Manager',   re: /googletagmanager\.com\/gtm|GTM-[A-Z0-9]+/i },
  { label: 'Google Site Kit',      re: /google-site-kit/i },
  { label: 'Meta Pixel',           re: /connect\.facebook\.net|fbevents\.js/i },
  { label: 'LiteSpeed Cache',      re: /litespeed|lscache/i },
  { label: 'WP Rocket',            re: /wp-rocket|rocket-loader/i },
  { label: 'Yoast SEO',            re: /yoast|wpseo/i },
  { label: 'All in One SEO',       re: /aioseo|all-in-one-seo/i },
  { label: 'Premio Chaty',         re: /chaty/i },
  { label: 'Swiper',               re: /swiper(\.min)?\.(js|css)/i },
  { label: 'Tiny Slider',          re: /tiny-slider|tns-/i },
  { label: 'SweetAlert2',          re: /sweetalert/i },
  { label: 'Cloudflare',           re: /cloudflare|cdnjs\.cloudflare/i },
]

function detectTech(html: string, headers: Record<string, string>): { label: string; crit: boolean; note: string }[] {
  const out: { label: string; crit: boolean; note: string }[] = []
  const seen = new Set<string>()
  const push = (label: string, note = '') => {
    if (seen.has(label)) return
    seen.add(label)
    out.push({ label, crit: false, note })
  }

  // Cabeceras del servidor
  const server = headers['server'] ?? ''
  const xPowered = headers['x-powered-by'] ?? ''
  if (/nginx/i.test(server)) push('Nginx')
  if (/apache/i.test(server)) push('Apache')
  if (/litespeed/i.test(server)) push('LiteSpeed')
  if (/hcdn|hostinger/i.test(server)) push('Hostinger CDN')
  if (headers['cf-ray']) push('Cloudflare CDN')
  if (/php/i.test(xPowered)) push('PHP', xPowered.replace(/^PHP\/?/i, '').trim())

  for (const { label, re } of TECH_PATTERNS) {
    if (!re.test(html)) continue
    // React servido desde wp-includes es el runtime de Gutenberg que trae
    // WordPress de fábrica; reportarlo como stack del sitio induce a error.
    if (label === 'React' && /wp-includes\/js\/dist\/vendor\/react/i.test(html)) continue
    push(label)
  }

  if (out.length === 0) push('Stack no detectado', 'Sin firmas reconocibles en el HTML servido')
  return out
}

/**
 * Descarga un archivo auxiliar. Devuelve null si no existe o no responde:
 * su ausencia es un dato válido del informe, nunca un fallo del escaneo.
 */
async function fetchTextOrNull(url: string): Promise<string | null> {
  try {
    const r = await safeFetchText(url, { timeoutMs: 5_000 })
    if (r.status < 200 || r.status >= 300) return null
    return r.bodyText
  } catch {
    return null
  }
}

function normalizeUrl(input: string): string {
  const s = input.trim()
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function domain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export async function fetchAndScan(rawUrl: string): Promise<RawScan | ScanError> {
  const requestedUrl = normalizeUrl(rawUrl)
  const fetchedAt = new Date().toISOString()

  // ── Fetch with timing ──────────────────────────────────────
  // Todo el tráfico saliente pasa por el gateway: valida el destino, bloquea
  // redes privadas y revalida cada redirect. Ver lib/security/safe-remote-fetch.
  const t0 = Date.now()
  let res: Awaited<ReturnType<typeof safeFetchText>>
  try {
    res = await safeFetchText(requestedUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
      timeoutMs: 15_000,
    })
  } catch (err: unknown) {
    if (err instanceof UnsafeUrlError) {
      return { url: requestedUrl, error: err.message }
    }
    const msg = err instanceof Error ? err.message : String(err)
    return { url: requestedUrl, error: `Fetch failed: ${msg}` }
  }
  const ttfb = Date.now() - t0

  // La auditoría describe la página que realmente se sirvió, no la que se pidió.
  // Con http://ejemplo.com → 301 → https://www.ejemplo.com, evaluar la URL
  // original marcaría isHttps=false y clasificaría mal los enlaces internos.
  const url = res.url || requestedUrl
  const dom = domain(url)

  const htmlRaw = res.bodyText
  const totalTime = Date.now() - t0
  const contentLength = htmlRaw.length

  const headers: Record<string, string> = {}
  res.headers.forEach((v, k) => { headers[k] = v })

  // ── Parse HTML ─────────────────────────────────────────────
  const $ = cheerio.load(htmlRaw)

  const title = $('title').first().text().trim()
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() ?? ''
  const canonical = $('link[rel="canonical"]').attr('href') ?? null
  const hasViewportMeta = $('meta[name="viewport"]').length > 0
  const robotsMeta = $('meta[name="robots"]').attr('content') ?? ''
  const hasRobotsMeta = !!robotsMeta

  const h1s = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h2s = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h3s = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean)

  // Un único selector devuelve los encabezados en orden de documento, que es lo
  // que hace falta para detectar saltos de nivel. Los arrays h1s/h2s/h3s por
  // separado pierden esa relación.
  const headingOutline = $('h1,h2,h3,h4,h5,h6').map((_, el) => ({
    level: Number(el.tagName.slice(1)),
    text: $(el).text().trim(),
  })).get()

  // Images
  const imgs = $('img')
  const totalImages = imgs.length
  let imagesNoAltAttr = 0
  let imagesWithEmptyAlt = 0
  imgs.each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt === undefined) imagesNoAltAttr++
    else if (alt.trim() === '') imagesWithEmptyAlt++
  })
  // Para SEO/accesibilidad una imagen de contenido con alt="" es tan invisible
  // como una sin el atributo: el lector de pantalla la omite y Google no la
  // indexa. Se cuentan juntas — antes solo se miraba el atributo ausente y el
  // informe declaraba "0 sin alt / OK" en sitios con decenas de alt vacíos.
  const imagesWithoutAlt = imagesNoAltAttr + imagesWithEmptyAlt

  // ── Schema JSON-LD ──
  // OJO: debe leerse ANTES de remover <script> para el word count. Cuando el
  // remove() iba primero, estos bloques ya no existían y hasSchema daba false
  // en todos los sitios.
  const schemaScripts = $('script[type="application/ld+json"]')
  const hasSchema = schemaScripts.length > 0
  const schemaTypes: string[] = []
  // Qué campos trae cada nodo, no solo su tipo: un agente necesita saber si
  // Organization declara dirección y teléfono, no solo que existe.
  const schemaIdentity: SchemaIdentity[] = []
  schemaScripts.each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text() || '{}')
      // Yoast/AIOSEO anidan todo bajo @graph; sin desenrollarlo se pierden
      // los tipos y Organization/LocalBusiness quedan sin detectar.
      const nodes = Array.isArray(parsed) ? parsed : (parsed['@graph'] ?? [parsed])
      for (const n of nodes) {
        const t = n?.['@type'] ?? n?.type
        if (!t) continue
        const fields = n && typeof n === 'object'
          ? Object.keys(n).filter(k => !k.startsWith('@'))
          : []
        for (const one of Array.isArray(t) ? t : [t]) {
          schemaTypes.push(String(one))
          schemaIdentity.push({ type: String(one), fields })
        }
      }
    } catch {}
  })

  // OG / Twitter
  const hasOpenGraph = $('meta[property^="og:"]').length > 0
  const hasTwitterCard = $('meta[name^="twitter:"]').length > 0

  // ── Señales de usabilidad/calidad de código ──
  const hreflangCount = $('link[rel="alternate"][hreflang]').length
  const langAttr = $('html').attr('lang')?.trim() || null
  const hasFavicon = $('link[rel*="icon"]').length > 0
  const iframeCount = $('iframe').length
  const inlineStyleCount = $('[style]').length

  // ── Señales de render en cliente ──
  // Deben leerse antes del remove() del word count, que destruye los <script>.
  const scriptCount = $('script').length
  const hasSpaRoot =
    $('#root, #app, #__next, [data-reactroot], [ng-version]').length > 0 ||
    /__NEXT_DATA__|__NUXT__/.test(htmlRaw)

  // ── Formularios ──
  // Un agente identifica cada campo por su atributo name y su etiqueta. Es
  // también el criterio WCAG 2.2 §3.3.2, que hasta ahora no se comprobaba.
  const formCount = $('form').length
  const inputs = $('input, select, textarea').filter((_, el) => {
    const type = ($(el).attr('type') ?? '').toLowerCase()
    return type !== 'hidden' && type !== 'submit' && type !== 'button'
  })
  let withName = 0, withAutocomplete = 0, withLabel = 0
  inputs.each((_, el) => {
    const $el = $(el)
    if ($el.attr('name')) withName++
    if ($el.attr('autocomplete')) withAutocomplete++
    const id = $el.attr('id')
    const labelled =
      (id && $(`label[for="${id.replace(/"/g, '\\"')}"]`).length > 0) ||
      $el.parents('label').length > 0 ||
      !!$el.attr('aria-label') ||
      !!$el.attr('aria-labelledby')
    if (labelled) withLabel++
  })
  const forms: FormStats = {
    formCount,
    inputCount: inputs.length,
    withName,
    withAutocomplete,
    withLabel,
  }

  // Emails en texto plano — cosechables por bots de spam
  const emailsInPlainText = [
    ...new Set((htmlRaw.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? [])),
  ].filter(e => !/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(e) && !e.includes('@2x')).slice(0, 5)

  // Links (rel=nofollow separado: no transmite autoridad)
  const allLinks = $('a[href]')
  let internalLinks = 0, externalLinks = 0, externalNofollow = 0
  const internalSet = new Set<string>()
  // Destinos únicos para la comprobación de enlaces rotos. Se guardan aparte de
  // internalUrls, que está filtrado para capturas de pantalla y descartaría
  // justo las rutas profundas donde suelen esconderse los enlaces muertos.
  const internalTargets = new Set<string>()
  const externalTargets = new Set<string>()
  const pageOrigin = new URL(url).origin
  allLinks.each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const rel = ($(el).attr('rel') ?? '').toLowerCase()

    const link = classifyLink(href, url, dom)
    if (link.kind === 'ignored') return

    if (link.kind === 'external') {
      externalLinks++
      if (rel.includes('nofollow')) externalNofollow++
      if (link.absolute) externalTargets.add(link.absolute)
      return
    }

    if (link.absolute) internalTargets.add(link.absolute)

    internalLinks++
    // Se guardan las rutas internas reales para poder capturar páginas
    // distintas y no repetir tres veces la portada.
    if (link.absolute && link.clean && isCapturablePage(link.absolute, pageOrigin)) {
      internalSet.add(link.clean)
    }
  })
  const internalUrls = [...internalSet].slice(0, 12)

  // ── Word count ──
  // Se hace al final: remove() destruye nodos y todo lo que dependa de
  // <script>/<svg> debe haberse leído ya.
  $('script, style, noscript, svg').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText.split(' ').filter(w => w.length > 2).length

  // ── Archivos externos ──
  // Antes solo se comprobaba que existieran y se tiraba el contenido. Leerlos
  // no cuesta una petición más y es lo que permite saber si el sitio bloquea
  // rastreadores de IA o lleva meses sin publicar.
  const baseUrl = pageOrigin
  const [robotsTxt, sitemapXml, llmsTxt, aiPlugin, mcpCard] = await Promise.all([
    fetchTextOrNull(`${baseUrl}/robots.txt`),
    fetchTextOrNull(`${baseUrl}/sitemap.xml`),
    fetchTextOrNull(`${baseUrl}/llms.txt`),
    safeFetchOk(`${baseUrl}/.well-known/ai-plugin.json`, { timeoutMs: 5_000 }).catch(() => false),
    safeFetchOk(`${baseUrl}/.well-known/mcp.json`, { timeoutMs: 5_000 }).catch(() => false),
  ])

  // ── Enlaces rotos ──
  // El campo brokenLinks existía desde el principio y siempre llegaba vacío.
  // Se comprueba una muestra acotada: se reparte entre internos y externos
  // porque un enlace interno muerto es más grave, pero los externos son los
  // que se pudren solos con el tiempo.
  const half = Math.ceil(MAX_LINKS_CHECKED / 2)
  const linkTargets: LinkTarget[] = [
    ...[...internalTargets].slice(0, half).map(u => ({ url: u, kind: 'internal' as const })),
    ...[...externalTargets].slice(0, MAX_LINKS_CHECKED - Math.min(half, internalTargets.size))
      .map(u => ({ url: u, kind: 'external' as const })),
  ]
  const linkChecks = await checkLinks(linkTargets)

  return {
    url,
    domain: dom,
    fetchedAt,
    ttfb,
    totalTime,
    statusCode: res.status,
    isHttps: new URL(url).protocol === 'https:',
    headers,
    contentLength,
    title,
    titleLen: title.length,
    metaDescription,
    metaDescLen: metaDescription.length,
    h1s,
    h2s,
    h3s,
    headingOutline,
    canonical,
    hasViewportMeta,
    hasRobotsMeta,
    robotsMetaContent: robotsMeta,
    totalImages,
    imagesWithoutAlt,
    imagesWithEmptyAlt,
    imagesNoAltAttr,
    wordCount,
    scriptCount,
    hasSpaRoot,
    forms,
    hreflangCount,
    langAttr,
    hasFavicon,
    iframeCount,
    inlineStyleCount,
    emailsInPlainText,
    externalNofollow,
    internalUrls,
    llmsTxtExists: llmsTxt !== null,
    hasSchema,
    schemaTypes,
    schemaIdentity,
    hasOpenGraph,
    hasTwitterCard,
    internalLinks,
    externalLinks,
    linkChecks,
    brokenLinks: confirmedBroken(linkChecks).map(c => c.url),
    robotsTxtExists: robotsTxt !== null,
    sitemapExists: sitemapXml !== null,
    robotsTxtContent: robotsTxt === null ? null : robotsTxt.slice(0, 8000),
    sitemapInfo: sitemapXml === null ? null : parseSitemap(sitemapXml),
    llmsTxtContent: llmsTxt === null ? null : llmsTxt.slice(0, 4000),
    wellKnown: { aiPlugin, mcp: mcpCard },
    htmlSnippet: htmlRaw.slice(0, 2000),
    techDetected: detectTech(htmlRaw, headers),
    screenshotUrl: buildDeviceShots(url).desktop,
    screenshots: buildDeviceShots(url),
  }
}
