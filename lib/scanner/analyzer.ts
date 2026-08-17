import type { RawScan, AuditResult, AuditFinding, AuditCompactFinding } from './types'

let findingCounter = 0
function nextId(prefix: string) {
  findingCounter++
  return `${prefix}-${String(findingCounter).padStart(3, '0')}`
}

function calcRisk(f: Pick<AuditFinding, 'severity' | 'confidence' | 'scope' | 'businessImpact'>) {
  return Math.round(f.severity * (f.confidence / 100) * f.scope * f.businessImpact * 10) / 10
}

export function analyze(raw: RawScan): AuditResult {
  findingCounter = 0
  const findings: AuditFinding[] = []
  const compact: AuditCompactFinding[] = []
  const dom = raw.domain.toUpperCase().replace(/[^A-Z0-9]/g, '')

  // ── P0 / P1 — Full findings ───────────────────────────────

  // HTTPS
  if (!raw.isHttps) {
    findings.push({
      id: nextId(`${dom}-SEC`), module: 'M13', category: 'Seguridad', priority: 'P0',
      stage: 'trust', title: 'Sitio sin HTTPS — conexión insegura',
      what: 'El sitio sirve contenido por HTTP sin cifrar. Los navegadores lo marcan como "No seguro".',
      impactBusiness: 'Google penaliza sitios sin HTTPS en rankings. Los usuarios ven advertencia de inseguridad.',
      impactUser: 'Los datos del usuario viajan sin cifrar. Riesgo real de interceptación.',
      impactTech: 'Migrar a HTTPS con certificado SSL/TLS (Let\'s Encrypt gratuito).',
      evidence: [{ source: 'HTTP response', value: `URL: ${raw.url} — sin certificado SSL` }],
      confidence: 99, severity: 5, scope: 2.0, businessImpact: 2.0,
      auditxStatus: 'CONFIRMED', effort: 'Medio',
      direction: 'Instalar certificado SSL en el servidor. Configurar redirección 301 HTTP → HTTPS. Actualizar todos los enlaces internos.',
      validate: 'Acceder al sitio — el navegador debe mostrar candado verde sin advertencias.',
      impact3mo: 'Penalización SEO activa. Usuarios con browsers modernos ven advertencia "No seguro".',
      impact6mo: 'Invisibilidad creciente en búsquedas. Desconfianza estructural de marca.',
    })
  }

  // HTTP error
  if (raw.statusCode >= 400) {
    findings.push({
      id: nextId(`${dom}-HTTP`), module: 'M01', category: 'HTTP / Accesibilidad', priority: 'P0',
      stage: 'arrive', title: `Error HTTP ${raw.statusCode} — página no cargó`,
      what: `El servidor respondió ${raw.statusCode} al intentar cargar la URL analizada.`,
      impactBusiness: 'Visitantes y crawlers ven error en lugar de contenido. Pérdida directa de tráfico.',
      impactUser: 'El usuario no puede acceder al sitio.',
      impactTech: 'Verificar configuración del servidor, redirecciones y disponibilidad.',
      evidence: [{ source: 'HTTP status', value: `${raw.statusCode}` }],
      confidence: 99, severity: 5, scope: 2.0, businessImpact: 2.0,
      auditxStatus: 'CONFIRMED', effort: 'Alto',
      direction: 'Verificar que el servidor esté activo y la URL sea correcta. Revisar redirecciones y DNS.',
      validate: 'URL devuelve 200 OK.',
      impact3mo: 'Sitio inaccesible = cero tráfico orgánico.',
      impact6mo: 'Deindexación por Google si el error persiste.',
    })
  }

  // Title issues
  if (!raw.title) {
    findings.push({
      id: nextId(`${dom}-SEO`), module: 'M04', category: 'SEO On-Page', priority: 'P0',
      stage: 'discover', title: 'Sin title tag — invisible en Google',
      what: 'La página no tiene etiqueta <title>. Google no puede generar snippet en SERP.',
      impactBusiness: 'Sin title = sin click en búsquedas. Ranking imposible para keywords objetivo.',
      impactUser: 'Tab del navegador muestra URL cruda. Desorientación inmediata.',
      impactTech: 'Añadir <title> único y descriptivo en el <head> de cada página.',
      evidence: [{ source: 'HTML <head>', value: 'Etiqueta <title> ausente' }],
      confidence: 99, severity: 5, scope: 2.0, businessImpact: 2.0,
      auditxStatus: 'CONFIRMED', effort: 'Bajo',
      direction: 'Añadir <title>[Keyword Principal] | [Nombre del negocio]</title> con 50-60 caracteres.',
      validate: 'view-source — <title> presente y descriptivo.',
      impact3mo: 'Invisibilidad total en búsquedas orgánicas.',
      impact6mo: 'Competidores con titles optimizados capturan todos los rankings.',
    })
  } else if (raw.titleLen < 30) {
    findings.push({
      id: nextId(`${dom}-SEO`), module: 'M04', category: 'SEO On-Page', priority: 'P1',
      stage: 'discover', title: `Title demasiado corto: ${raw.titleLen} caracteres`,
      what: `El title tiene solo ${raw.titleLen} chars. El rango óptimo es 50-60 caracteres para maximizar CTR.`,
      impactBusiness: 'Snippet en Google no comunica propuesta de valor. CTR por debajo del potencial.',
      impactUser: 'El usuario no entiende qué ofrece la página antes de hacer click.',
      impactTech: 'Reescribir el title con keywords primarias y nombre de marca.',
      evidence: [{ source: 'HTML <title>', value: `"${raw.title}" (${raw.titleLen} chars)` }],
      confidence: 95, severity: 3, scope: 1.0, businessImpact: 1.5,
      auditxStatus: 'CONFIRMED', effort: 'Bajo',
      direction: 'Reescribir a 50-60 chars con formato: [Keyword Principal] | [Beneficio] | Marca.',
      validate: 'Google SERP preview — title visible completo sin truncar.',
      impact3mo: 'CTR orgánico sub-óptimo.',
      impact6mo: 'Pérdida acumulada de clics frente a competidores con titles optimizados.',
    })
  } else if (raw.titleLen > 65) {
    compact.push({
      id: nextId(`${dom}-SEO`), module: 'M04',
      title: `Title largo: ${raw.titleLen} chars (óptimo: 50-60) — Google lo trunca`, effort: 'Bajo', priority: 'P2',
    })
  }

  // Meta description
  if (!raw.metaDescription) {
    findings.push({
      id: nextId(`${dom}-SEO`), module: 'M04', category: 'SEO On-Page', priority: 'P1',
      stage: 'discover', title: 'Sin meta description — Google genera snippets automáticos',
      what: 'No hay meta description. Google elige texto aleatorio de la página para el snippet, frecuentemente poco persuasivo.',
      impactBusiness: 'CTR orgánico no controlado. Oportunidad desperdiciada de pre-vender el click.',
      impactUser: 'El snippet en Google no describe claramente el valor del sitio.',
      impactTech: 'Añadir meta description única por página en 145-155 caracteres.',
      evidence: [{ source: 'HTML <head>', value: 'Meta description ausente' }],
      confidence: 97, severity: 3, scope: 2.0, businessImpact: 1.5,
      auditxStatus: 'CONFIRMED', effort: 'Bajo',
      direction: 'Añadir <meta name="description" content="..."> con CTA implícito y keywords en 145-155 chars.',
      validate: 'Google Search Console — snippet controlado en resultados de búsqueda.',
      impact3mo: 'CTR menor en keywords donde Google genera snippets poco relevantes.',
      impact6mo: 'Pérdida acumulada de tráfico orgánico por snippets no optimizados.',
    })
  } else if (raw.metaDescLen > 160) {
    compact.push({
      id: nextId(`${dom}-SEO`), module: 'M04',
      title: `Meta description: ${raw.metaDescLen} chars — Google la trunca (max 155)`, effort: 'Bajo', priority: 'P2',
    })
  }

  // H1
  if (raw.h1s.length === 0) {
    findings.push({
      id: nextId(`${dom}-SEO`), module: 'M04', category: 'SEO On-Page', priority: 'P1',
      stage: 'discover', title: 'Sin H1 — Google no puede identificar el tema principal',
      what: 'La página no tiene etiqueta H1. Es la señal más importante para que Google entienda el tema de la página.',
      impactBusiness: 'Rankings para keywords principales deprimidos. Google no sabe qué jerarquizar.',
      impactUser: 'Sin encabezado principal, la página pierde estructura visual y semántica.',
      impactTech: 'Añadir exactamente un H1 que incluya la keyword primaria del negocio.',
      evidence: [{ source: 'HTML body', value: '0 etiquetas H1 detectadas' }],
      confidence: 97, severity: 4, scope: 1.0, businessImpact: 1.5,
      auditxStatus: 'CONFIRMED', effort: 'Bajo',
      direction: 'Añadir un H1 único por página con keyword primaria. Ej: "Agencia de Marketing Digital en Bolivia | Baral".',
      validate: 'Herramienta SEO — exactamente 1 H1 en la página.',
      impact3mo: 'Rankings para keywords de negocio por debajo del potencial.',
      impact6mo: 'Competidores con H1 optimizados consolidan rankings.',
    })
  } else if (raw.h1s.length > 1) {
    findings.push({
      id: nextId(`${dom}-SEO`), module: 'M04', category: 'SEO On-Page', priority: 'P1',
      stage: 'discover', title: `H1 duplicados: ${raw.h1s.length} etiquetas H1 en la misma página`,
      what: `La página tiene ${raw.h1s.length} H1 distintos. Google recibe señales contradictorias sobre el tema principal.`,
      impactBusiness: 'Señal confusa a Google sobre el tema principal → rankings dispersos y sub-óptimos.',
      impactUser: 'Estructura de contenido confusa. El usuario no identifica el mensaje principal.',
      impactTech: 'Reducir a exactamente 1 H1 por página. Los demás encabezados deben ser H2/H3.',
      evidence: raw.h1s.slice(0, 3).map((t, i) => ({ source: `H1 #${i + 1}`, value: t.slice(0, 80) })),
      confidence: 98, severity: 3, scope: 1.0, businessImpact: 1.5,
      auditxStatus: 'CONFIRMED', effort: 'Bajo',
      direction: 'Mantener solo el H1 más relevante para la keyword primaria. Cambiar los demás a H2 o H3.',
      validate: 'view-source — solo 1 etiqueta <h1> visible.',
      impact3mo: 'Google interpreta tema ambiguo → rankings en keywords objetivo débiles.',
      impact6mo: 'Pérdida acumulada de posiciones frente a páginas con jerarquía clara.',
    })
  }

  // Images without alt
  if (raw.imagesWithoutAlt > 5 || (raw.totalImages > 0 && raw.imagesWithoutAlt / raw.totalImages > 0.3)) {
    const pct = raw.totalImages > 0 ? Math.round((raw.imagesWithoutAlt / raw.totalImages) * 100) : 0
    findings.push({
      id: nextId(`${dom}-A11Y`), module: 'M08', category: 'Accesibilidad / SEO', priority: 'P1',
      stage: 'discover', title: `${raw.imagesWithoutAlt} de ${raw.totalImages} imágenes sin alt text (${pct}%)`,
      what: `El ${pct}% de las imágenes del sitio carecen de texto alternativo. Afecta SEO de imágenes y accesibilidad.`,
      impactBusiness: 'Pérdida de tráfico desde Google Images. Riesgo de incumplimiento de accesibilidad.',
      impactUser: 'Usuarios con lectores de pantalla reciben solo el nombre del archivo o nada.',
      impactTech: 'Auditar Biblioteca de Medios y añadir alt descriptivo a cada imagen relevante.',
      evidence: [
        { source: 'Análisis HTML', value: `${raw.imagesWithoutAlt}/${raw.totalImages} imágenes sin atributo alt` },
        { source: 'Porcentaje', value: `${pct}% del inventario de imágenes sin alt` },
      ],
      confidence: 95, severity: 3, scope: 2.0, businessImpact: 1.0,
      auditxStatus: 'CONFIRMED', effort: 'Medio',
      direction: 'Añadir alt descriptivo a imágenes de contenido. Usar alt="" para imágenes decorativas.',
      validate: 'WAVE o axe DevTools — cero errores de imagen sin alt en páginas principales.',
      impact3mo: 'SEO de imágenes estancado. Riesgo legal de accesibilidad.',
      impact6mo: 'Pérdida sostenida de tráfico visual y posible exposición regulatoria.',
    })
  }

  // Thin content
  if (raw.wordCount < 300 && raw.wordCount > 0) {
    compact.push({
      id: nextId(`${dom}-CONTENT`), module: 'M06',
      title: `Thin content: solo ${raw.wordCount} palabras (benchmark mínimo: 300+)`, effort: 'Alto', priority: 'P2',
    })
  }

  // TTFB lento
  if (raw.ttfb > 2000) {
    findings.push({
      id: nextId(`${dom}-PERF`), module: 'M07', category: 'Performance', priority: 'P1',
      stage: 'arrive', title: `TTFB lento: ${(raw.ttfb / 1000).toFixed(1)}s — servidor responde tarde`,
      what: `El servidor tardó ${(raw.ttfb / 1000).toFixed(1)}s en responder. El umbral ideal es < 0.8s (Core Web Vitals).`,
      impactBusiness: 'Google penaliza en rankings sitios con TTFB > 0.8s. Cada 100ms extra reduce conversiones ~1%.',
      impactUser: 'El usuario espera segundos antes de ver cualquier contenido. Alta probabilidad de abandono.',
      impactTech: 'Revisar hosting, activar caché de servidor, optimizar consultas de base de datos.',
      evidence: [{ source: 'Medición real', value: `TTFB: ${raw.ttfb}ms desde el auditor` }],
      confidence: 90, severity: 4, scope: 2.0, businessImpact: 2.0,
      auditxStatus: 'CONFIRMED', effort: 'Medio',
      direction: 'Activar caché de página completa (LiteSpeed Cache, WP Rocket). Considerar CDN. Optimizar PHP/DB.',
      validate: 'PageSpeed Insights — TTFB < 0.8s (verde) en datos de campo.',
      impact3mo: 'Penalización CWV activa en Google Search.',
      impact6mo: 'Rankings deprimidos por Core Web Vitals deficientes.',
    })
  } else if (raw.ttfb > 800) {
    compact.push({
      id: nextId(`${dom}-PERF`), module: 'M07',
      title: `TTFB mejorable: ${raw.ttfb}ms (objetivo: < 800ms para Core Web Vitals)`, effort: 'Medio', priority: 'P2',
    })
  }

  // No viewport meta
  if (!raw.hasViewportMeta) {
    findings.push({
      id: nextId(`${dom}-MOBILE`), module: 'M09', category: 'Mobile / UX', priority: 'P1',
      stage: 'arrive', title: 'Sin meta viewport — sitio no es mobile-friendly',
      what: 'Falta <meta name="viewport">. El sitio no se adapta a pantallas móviles.',
      impactBusiness: 'Google aplica Mobile-First Indexing: un sitio no responsive pierde rankings drásticamente.',
      impactUser: 'En móvil el contenido aparece diminuto o desbordado. Tasa de rebote altísima.',
      impactTech: 'Añadir <meta name="viewport" content="width=device-width, initial-scale=1"> en el <head>.',
      evidence: [{ source: 'HTML <head>', value: 'Meta viewport ausente' }],
      confidence: 99, severity: 4, scope: 2.0, businessImpact: 2.0,
      auditxStatus: 'CONFIRMED', effort: 'Bajo',
      direction: 'Añadir meta viewport. Si usa WordPress/CMS, el tema debe ser responsive.',
      validate: 'Chrome DevTools modo móvil — contenido se adapta correctamente.',
      impact3mo: 'Penalización Mobile-First Indexing activa.',
      impact6mo: 'Pérdida de más del 60% del tráfico potencial (mayoría llega por móvil).',
    })
  }

  // No sitemap
  if (!raw.sitemapExists) {
    compact.push({
      id: nextId(`${dom}-SEO`), module: 'M02',
      title: 'Sitemap.xml no encontrado — crawlers no tienen mapa del sitio', effort: 'Bajo', priority: 'P2',
    })
  }

  // No robots.txt
  if (!raw.robotsTxtExists) {
    compact.push({
      id: nextId(`${dom}-SEO`), module: 'M02',
      title: 'Robots.txt no encontrado — sin control de indexación de crawlers', effort: 'Bajo', priority: 'P2',
    })
  }

  // No canonical
  if (!raw.canonical) {
    compact.push({
      id: nextId(`${dom}-SEO`), module: 'M04',
      title: 'Sin canonical tag — riesgo de contenido duplicado entre versiones URL', effort: 'Bajo', priority: 'P2',
    })
  }

  // No schema
  if (!raw.hasSchema) {
    compact.push({
      id: nextId(`${dom}-SEO`), module: 'M10',
      title: 'Sin Schema JSON-LD — sin rich results ni LocalBusiness para búsquedas locales', effort: 'Medio', priority: 'P2',
    })
  }

  // No OpenGraph
  if (!raw.hasOpenGraph) {
    compact.push({
      id: nextId(`${dom}-SOCIAL`), module: 'M17',
      title: 'Sin Open Graph tags — links en redes sociales sin imagen ni título optimizados', effort: 'Bajo', priority: 'P3',
    })
  }

  // No Twitter Card
  if (!raw.hasTwitterCard) {
    compact.push({
      id: nextId(`${dom}-SOCIAL`), module: 'M17',
      title: 'Sin Twitter Card meta — compartir en X/Twitter sin preview visual', effort: 'Bajo', priority: 'P3',
    })
  }

  // ── Scoring ───────────────────────────────────────────────
  const p0 = findings.filter(f => f.priority === 'P0').length
  const p1 = findings.filter(f => f.priority === 'P1').length
  const p2 = compact.filter(f => f.priority === 'P2').length

  const seoScore = Math.max(5, 100
    - (raw.title ? 0 : 30)
    - (raw.metaDescription ? 0 : 15)
    - (raw.h1s.length === 1 ? 0 : raw.h1s.length === 0 ? 20 : 10)
    - (raw.robotsTxtExists ? 0 : 5)
    - (raw.sitemapExists ? 0 : 5)
    - (raw.canonical ? 0 : 5)
    - (raw.hasSchema ? 0 : 5)
    - p0 * 8 - p1 * 3)

  const perfScore = Math.max(5, 100
    - (raw.ttfb > 2000 ? 40 : raw.ttfb > 800 ? 20 : 0)
    - (raw.isHttps ? 0 : 10)
    - p0 * 3)

  const a11yScore = Math.max(5, 100
    - (raw.hasViewportMeta ? 0 : 30)
    - (raw.totalImages > 0 ? Math.round((raw.imagesWithoutAlt / raw.totalImages) * 40) : 0)
    - p1 * 2)

  const convScore = Math.max(5, 100
    - (raw.hasOpenGraph ? 0 : 10)
    - (raw.hasTwitterCard ? 0 : 5)
    - p0 * 10 - p1 * 5 - p2 * 2)

  const overall = Math.round((seoScore * 0.35 + perfScore * 0.25 + a11yScore * 0.2 + convScore * 0.2))

  // ── Tech detection (best-effort from headers/HTML) ────────
  const tech: { label: string; crit: boolean; note: string }[] = []
  const server = raw.headers['server'] ?? ''
  const xPowered = raw.headers['x-powered-by'] ?? ''
  if (/nginx/i.test(server)) tech.push({ label: 'Nginx', crit: false, note: '' })
  if (/apache/i.test(server)) tech.push({ label: 'Apache', crit: false, note: '' })
  if (/litespeed/i.test(server)) tech.push({ label: 'LiteSpeed', crit: false, note: '' })
  if (/cloudflare/i.test(server) || raw.headers['cf-ray']) tech.push({ label: 'Cloudflare CDN', crit: false, note: '' })
  if (/php/i.test(xPowered)) tech.push({ label: 'PHP', crit: false, note: xPowered })
  if (/WordPress/i.test(raw.htmlSnippet)) tech.push({ label: 'WordPress', crit: false, note: '' })
  if (/Elementor/i.test(raw.htmlSnippet)) tech.push({ label: 'Elementor', crit: false, note: '' })
  if (/shopify/i.test(raw.htmlSnippet)) tech.push({ label: 'Shopify', crit: false, note: '' })
  if (/wix\.com/i.test(raw.htmlSnippet)) tech.push({ label: 'Wix', crit: false, note: '' })
  if (/squarespace/i.test(raw.htmlSnippet)) tech.push({ label: 'Squarespace', crit: false, note: '' })
  if (/gtag|GA4|G-[A-Z0-9]/i.test(raw.htmlSnippet)) tech.push({ label: 'Google Analytics 4', crit: false, note: '' })
  if (/gtm\.js|GTM-/i.test(raw.htmlSnippet)) tech.push({ label: 'Google Tag Manager', crit: false, note: '' })
  if (tech.length === 0) tech.push({ label: 'Stack no detectado', crit: false, note: 'Análisis de headers insuficiente' })

  return {
    domain: raw.domain,
    url: raw.url,
    scanDate: raw.fetchedAt,
    scores: { overall, performance: perfScore, seo: seoScore, accessibility: a11yScore, conversion: convScore },
    findings,
    compactFindings: compact,
    tech,
    raw,
  }
}
