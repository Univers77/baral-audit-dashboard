import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analyze } from '@/lib/scanner/analyzer'
import type { RawScan } from '@/lib/scanner/types'

/** Sitio sano. Cada test degrada un solo aspecto para aislar el hallazgo. */
function scan(over: Partial<RawScan> = {}): RawScan {
  return {
    url: 'https://ejemplo.com/',
    domain: 'ejemplo.com',
    fetchedAt: '2026-08-19T00:00:00.000Z',
    ttfb: 300,
    totalTime: 420,
    statusCode: 200,
    isHttps: true,
    headers: {
      'strict-transport-security': 'max-age=31536000',
      'content-security-policy': "default-src 'self'",
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'referrer-policy': 'strict-origin',
      'permissions-policy': 'geolocation=()',
    },
    contentLength: 40_000,
    title: 'Ejemplo — Servicios profesionales en Santa Cruz',
    titleLen: 46,
    metaDescription: 'Descripción suficientemente larga para no disparar hallazgos de longitud.',
    metaDescLen: 72,
    h1s: ['Título'],
    h2s: ['Sección'],
    h3s: [],
    headingOutline: [{ level: 1, text: 'Título' }, { level: 2, text: 'Sección' }],
    canonical: 'https://ejemplo.com/',
    hasViewportMeta: true,
    hasRobotsMeta: false,
    robotsMetaContent: '',
    totalImages: 10,
    imagesWithoutAlt: 0,
    imagesWithEmptyAlt: 0,
    imagesNoAltAttr: 0,
    wordCount: 1500,
    scriptCount: 3,
    hasSpaRoot: false,
    hasSchema: true,
    schemaTypes: ['LocalBusiness'],
    schemaIdentity: [{ type: 'LocalBusiness', fields: ['name', 'address', 'telephone'] }],
    forms: { formCount: 1, inputCount: 3, withName: 3, withAutocomplete: 3, withLabel: 3 },
    hasOpenGraph: true,
    hasTwitterCard: true,
    internalLinks: 25,
    externalLinks: 5,
    externalNofollow: 2,
    internalUrls: [],
    brokenLinks: [],
    hreflangCount: 0,
    langAttr: 'es',
    hasFavicon: true,
    iframeCount: 0,
    inlineStyleCount: 0,
    emailsInPlainText: [],
    robotsTxtExists: true,
    sitemapExists: true,
    llmsTxtExists: true,
    robotsTxtContent: 'User-agent: *\nDisallow: /admin',
    sitemapInfo: null,
    llmsTxtContent: '# Ejemplo',
    wellKnown: { aiPlugin: false, mcp: false },
    htmlSnippet: '',
    techDetected: [{ label: 'Google Analytics 4', crit: false, note: '' }],
    screenshotUrl: '',
    screenshots: { mobile: '', tablet: '', desktop: '' },
    ...over,
  }
}

const titles = (r: ReturnType<typeof analyze>) =>
  [...r.findings.map(f => f.title), ...r.compactFindings.map(f => f.title)].join(' | ')

describe('analyze — contenido escaso vs render en cliente', () => {
  it('una página corta y estática se reporta como contenido escaso', () => {
    const r = analyze(scan({ wordCount: 150, scriptCount: 1, hasSpaRoot: false }))
    const f = r.compactFindings.find(x => x.title.includes('Contenido escaso'))
    assert.ok(f)
    assert.equal(f.module, 'M06')
    assert.equal(f.priority, 'P2')
  })

  it('una aplicación montada en el navegador NO se reporta como contenido escaso', () => {
    // El diagnóstico invertido era el defecto: el texto existe, pero no viaja
    // en el HTML, y la solución es otra.
    const r = analyze(scan({ wordCount: 8, scriptCount: 14, hasSpaRoot: true }))
    assert.equal(titles(r).includes('Contenido escaso'), false)
    const f = r.compactFindings.find(x => x.title.includes('montado en el navegador'))
    assert.ok(f)
    assert.equal(f.module, 'M03')
    assert.equal(f.priority, 'P1')
  })

  it('concuerda el singular de "palabra"', () => {
    const r = analyze(scan({ wordCount: 1, scriptCount: 12, hasSpaRoot: true }))
    assert.equal(titles(r).includes('1 palabra '), true)
    assert.equal(titles(r).includes('1 palabras'), false)
  })

  it('una página con contenido suficiente no dispara ninguno de los dos', () => {
    const t = titles(analyze(scan()))
    assert.equal(t.includes('Contenido escaso'), false)
    assert.equal(t.includes('montado en el navegador'), false)
  })
})

describe('analyze — rastreadores de IA bloqueados', () => {
  it('emite un hallazgo P1 cuando robots.txt los bloquea', () => {
    const r = analyze(scan({ robotsTxtContent: 'User-agent: GPTBot\nDisallow: /' }))
    const f = r.findings.find(x => x.title.includes('rastreador'))
    assert.ok(f)
    assert.equal(f.priority, 'P1')
    assert.equal(f.evidence.length, 1)
    assert.equal(r.agentReadiness.blockedCount, 1)
  })

  it('no emite nada cuando ninguno está bloqueado', () => {
    const r = analyze(scan())
    assert.equal(r.findings.some(x => x.title.includes('rastreador')), false)
  })
})

describe('analyze — cabeceras de seguridad', () => {
  it('no reporta nada cuando están todas', () => {
    assert.equal(titles(analyze(scan())).includes('Sin cabecera'), false)
  })

  it('reporta cada cabecera ausente', () => {
    const r = analyze(scan({ headers: {} }))
    const t = titles(r)
    assert.equal(t.includes('Sin cabecera HSTS'), true)
    assert.equal(t.includes('Sin cabecera Content-Security-Policy'), true)
  })

  it('reporta la fuga de versión del stack', () => {
    const r = analyze(scan({ headers: { ...scan().headers, 'x-powered-by': 'PHP/8.1.2' } }))
    assert.equal(titles(r).includes('PHP/8.1.2'), true)
  })
})

describe('analyze — estructura y frescura', () => {
  it('detecta un salto de nivel en los encabezados', () => {
    const r = analyze(scan({
      headingOutline: [{ level: 1, text: 'A' }, { level: 4, text: 'Saltado' }],
    }))
    assert.equal(titles(r).includes('Salto de nivel'), true)
  })

  it('detecta campos de formulario sin etiqueta', () => {
    const r = analyze(scan({
      forms: { formCount: 1, inputCount: 4, withName: 4, withAutocomplete: 0, withLabel: 1 },
    }))
    assert.equal(titles(r).includes('3 de 4 campos'), true)
  })

  it('detecta contenido estancado según el sitemap', () => {
    const r = analyze(scan({
      sitemapInfo: {
        isIndex: false, urlCount: 10, children: [],
        newestLastmod: '2025-01-01T00:00:00.000Z', oldestLastmod: '2024-01-01T00:00:00.000Z',
        staleDays: 400, withLastmod: 10,
      },
    }))
    assert.equal(titles(r).includes('400 días'), true)
  })

  it('no reporta estancamiento cuando el sitemap está fresco', () => {
    const r = analyze(scan({
      sitemapInfo: {
        isIndex: false, urlCount: 10, children: [],
        newestLastmod: '2026-08-10T00:00:00.000Z', oldestLastmod: '2024-01-01T00:00:00.000Z',
        staleDays: 9, withLastmod: 10,
      },
    }))
    assert.equal(titles(r).includes('publicaciones nuevas'), false)
  })
})

describe('analyze — cobertura declarada', () => {
  it('la accesibilidad se declara contra los 56 criterios WCAG A+AA', () => {
    const c = analyze(scan()).coverage.pillars.find(p => p.key === 'accessibility')
    assert.ok(c)
    assert.equal(c.total, 56)
    assert.equal(c.run < c.total, true)
  })

  it('todos los pilares declaran ejecutados y posibles', () => {
    for (const p of analyze(scan()).coverage.pillars) {
      assert.equal(p.total > 0, true)
      assert.equal(p.run <= p.total, true)
      assert.equal(p.note.length > 30, true)
    }
  })
})
