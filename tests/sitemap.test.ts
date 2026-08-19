import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSitemap } from '@/lib/scanner/sitemap'

/** Fecha fija: la antigüedad medida no puede depender del día en que se corran los tests. */
const NOW = new Date('2026-08-19T00:00:00.000Z')

const PLANO = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://ejemplo.com/</loc><lastmod>2026-08-01</lastmod></url>
  <url><loc>https://ejemplo.com/servicios</loc><lastmod>2025-03-15</lastmod></url>
  <url><loc>https://ejemplo.com/contacto</loc></url>
</urlset>`

const INDICE = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://ejemplo.com/post-sitemap.xml</loc></sitemap>
  <sitemap><loc>https://ejemplo.com/page-sitemap.xml</loc></sitemap>
</sitemapindex>`

describe('parseSitemap — sitemap plano', () => {
  const s = parseSitemap(PLANO, NOW)

  it('no lo confunde con un índice', () => {
    assert.equal(s.isIndex, false)
    assert.deepEqual(s.children, [])
  })

  it('cuenta todas las URLs', () => {
    assert.equal(s.urlCount, 3)
  })

  it('cuenta solo las que declaran lastmod', () => {
    assert.equal(s.withLastmod, 2)
  })

  it('identifica la fecha más reciente y la más antigua', () => {
    assert.equal(s.newestLastmod?.slice(0, 10), '2026-08-01')
    assert.equal(s.oldestLastmod?.slice(0, 10), '2025-03-15')
  })

  it('calcula los días desde la última publicación', () => {
    assert.equal(s.staleDays, 18)
  })
})

describe('parseSitemap — índice de sitemaps', () => {
  const s = parseSitemap(INDICE, NOW)

  it('lo reconoce como índice y lista los hijos', () => {
    assert.equal(s.isIndex, true)
    assert.equal(s.children.length, 2)
    assert.equal(s.children[0], 'https://ejemplo.com/post-sitemap.xml')
  })

  it('sin lastmod no inventa antigüedad', () => {
    assert.equal(s.staleDays, null)
    assert.equal(s.newestLastmod, null)
  })
})

describe('parseSitemap — entradas degradadas', () => {
  it('devuelve vacío ante una cadena vacía', () => {
    const s = parseSitemap('', NOW)
    assert.equal(s.urlCount, 0)
    assert.equal(s.staleDays, null)
  })

  it('descarta fechas no parseables en vez de propagar NaN', () => {
    const s = parseSitemap(`<urlset>
      <url><loc>https://x.com/a</loc><lastmod>no-es-fecha</lastmod></url>
      <url><loc>https://x.com/b</loc><lastmod>2026-01-01</lastmod></url>
    </urlset>`, NOW)
    assert.equal(s.withLastmod, 1)
    assert.equal(s.newestLastmod?.slice(0, 10), '2026-01-01')
    assert.equal(Number.isFinite(s.staleDays), true)
  })

  it('lee valores envueltos en CDATA', () => {
    const s = parseSitemap(`<urlset>
      <url><loc><![CDATA[https://x.com/a]]></loc></url>
    </urlset>`, NOW)
    assert.equal(s.urlCount, 1)
  })

  it('acepta lastmod con hora y zona horaria', () => {
    const s = parseSitemap(`<urlset>
      <url><loc>https://x.com/a</loc><lastmod>2026-08-18T10:30:00+00:00</lastmod></url>
    </urlset>`, NOW)
    assert.equal(s.staleDays, 0)
  })
})
