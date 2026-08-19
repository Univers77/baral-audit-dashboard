/**
 * Parseo de sitemap.xml.
 *
 * Se descargaba solo para comprobar existencia. El contenido trae una señal que
 * no aparece en ningún otro sitio del informe: las fechas `lastmod` revelan si
 * el sitio sigue vivo o lleva meses sin publicar.
 */

export interface SitemapInfo {
  /** true si es un índice que apunta a otros sitemaps */
  isIndex: boolean
  urlCount: number
  /** sitemaps hijos, solo cuando isIndex */
  children: string[]
  newestLastmod: string | null
  oldestLastmod: string | null
  /** días desde la última actualización declarada; null si no hay lastmod */
  staleDays: number | null
  /** cuántas URLs declaran lastmod */
  withLastmod: number
}

const EMPTY: SitemapInfo = {
  isIndex: false,
  urlCount: 0,
  children: [],
  newestLastmod: null,
  oldestLastmod: null,
  staleDays: null,
  withLastmod: 0,
}

function tagValues(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const v = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
    if (v) out.push(v)
  }
  return out
}

/**
 * @param now inyectable para que los tests no dependan de la fecha real
 */
export function parseSitemap(xml: string, now: Date = new Date()): SitemapInfo {
  if (!xml || !xml.trim()) return EMPTY

  const isIndex = /<sitemapindex[\s>]/i.test(xml)
  const locs = tagValues(xml, 'loc')
  const lastmods = tagValues(xml, 'lastmod')

  // Las fechas inválidas se descartan en vez de propagarse como NaN.
  const stamps = lastmods
    .map(d => Date.parse(d))
    .filter(t => Number.isFinite(t))
    .sort((a, b) => a - b)

  const newest = stamps.length ? stamps[stamps.length - 1] : null
  const oldest = stamps.length ? stamps[0] : null

  return {
    isIndex,
    urlCount: locs.length,
    children: isIndex ? locs : [],
    newestLastmod: newest === null ? null : new Date(newest).toISOString(),
    oldestLastmod: oldest === null ? null : new Date(oldest).toISOString(),
    staleDays: newest === null ? null : Math.floor((now.getTime() - newest) / 86_400_000),
    withLastmod: stamps.length,
  }
}

/** Umbral de contenido estancado: medio año sin publicar nada. */
export const STALE_THRESHOLD_DAYS = 180
