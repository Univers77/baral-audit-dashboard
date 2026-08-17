import * as cheerio from 'cheerio'
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

function normalizeUrl(input: string): string {
  const s = input.trim()
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function domain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export async function fetchAndScan(rawUrl: string): Promise<RawScan | ScanError> {
  const url = normalizeUrl(rawUrl)
  const dom = domain(url)
  const fetchedAt = new Date().toISOString()

  // ── Fetch with timing ──────────────────────────────────────
  const t0 = Date.now()
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { url, error: `Fetch failed: ${msg}` }
  }
  const ttfb = Date.now() - t0

  const htmlRaw = await res.text().catch(() => '')
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
  schemaScripts.each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text() || '{}')
      // Yoast/AIOSEO anidan todo bajo @graph; sin desenrollarlo se pierden
      // los tipos y Organization/LocalBusiness quedan sin detectar.
      const nodes = Array.isArray(parsed) ? parsed : (parsed['@graph'] ?? [parsed])
      for (const n of nodes) {
        const t = n?.['@type'] ?? n?.type
        if (!t) continue
        for (const one of Array.isArray(t) ? t : [t]) schemaTypes.push(String(one))
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

  // Emails en texto plano — cosechables por bots de spam
  const emailsInPlainText = [
    ...new Set((htmlRaw.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? [])),
  ].filter(e => !/\.(png|jpe?g|gif|svg|webp|css|js)$/i.test(e) && !e.includes('@2x')).slice(0, 5)

  // Links (rel=nofollow separado: no transmite autoridad)
  const allLinks = $('a[href]')
  let internalLinks = 0, externalLinks = 0, externalNofollow = 0
  allLinks.each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const rel = ($(el).attr('rel') ?? '').toLowerCase()
    const isExternal = /^https?:\/\//i.test(href) && !href.includes(dom)
    if (isExternal) {
      externalLinks++
      if (rel.includes('nofollow')) externalNofollow++
    } else if (href.startsWith('/') || href.includes(dom)) {
      internalLinks++
    }
  })

  // ── Word count ──
  // Se hace al final: remove() destruye nodos y todo lo que dependa de
  // <script>/<svg> debe haberse leído ya.
  $('script, style, noscript, svg').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText.split(' ').filter(w => w.length > 2).length

  // External checks (robots.txt + sitemap + llms.txt para crawlers de IA)
  const baseUrl = new URL(url).origin
  const [robotsTxtExists, sitemapExists, llmsTxtExists] = await Promise.all([
    fetch(`${baseUrl}/robots.txt`, { signal: AbortSignal.timeout(5_000) })
      .then(r => r.ok).catch(() => false),
    fetch(`${baseUrl}/sitemap.xml`, { signal: AbortSignal.timeout(5_000) })
      .then(r => r.ok).catch(() => false),
    fetch(`${baseUrl}/llms.txt`, { signal: AbortSignal.timeout(5_000) })
      .then(r => r.ok).catch(() => false),
  ])

  return {
    url,
    domain: dom,
    fetchedAt,
    ttfb,
    totalTime,
    statusCode: res.status,
    isHttps: url.startsWith('https'),
    headers,
    contentLength,
    title,
    titleLen: title.length,
    metaDescription,
    metaDescLen: metaDescription.length,
    h1s,
    h2s,
    h3s,
    canonical,
    hasViewportMeta,
    hasRobotsMeta,
    robotsMetaContent: robotsMeta,
    totalImages,
    imagesWithoutAlt,
    imagesWithEmptyAlt,
    imagesNoAltAttr,
    wordCount,
    hreflangCount,
    langAttr,
    hasFavicon,
    iframeCount,
    inlineStyleCount,
    emailsInPlainText,
    externalNofollow,
    llmsTxtExists,
    hasSchema,
    schemaTypes,
    hasOpenGraph,
    hasTwitterCard,
    internalLinks,
    externalLinks,
    brokenLinks: [],
    robotsTxtExists,
    sitemapExists,
    htmlSnippet: htmlRaw.slice(0, 2000),
    screenshotUrl: buildDeviceShots(url).desktop,
    screenshots: buildDeviceShots(url),
  }
}
