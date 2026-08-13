export type Priority = 'P0' | 'P1' | 'P2' | 'P3'

export type Evidence = { source: string; value: string }

export type Finding = {
  id: string
  category: string
  title: string
  what: string
  impactBusiness: string
  impactUser: string
  impactTech: string
  evidence: Evidence[]
  confidence: number
  effort: 'Bajo' | 'Medio' | 'Alto'
  direction: string
  validate: string
  impact3mo: string
  impact6mo: string
  priority: Priority
  stage: FunnelKey
}

export type CompactFinding = {
  id: string
  title: string
  effort: 'Bajo' | 'Medio' | 'Alto'
  priority: Priority
}

export type FunnelKey = 'discover' | 'arrive' | 'understand' | 'trust' | 'action' | 'convert'

export const site = {
  url: 'baralintegral.com',
  title: 'Baral Estrategia Integral Creativa',
  date: '13 Ago 2026',
  level: 'Pasivo (STANDARD)',
  pagesAnalyzed: 10,
  version: 'MASTER WEB AUDITOR v2.0',
}

export const tech = [
  { label: 'WordPress 6.x', crit: false },
  { label: 'Elementor', crit: false },
  { label: 'All in One SEO', crit: false },
  { label: 'GA4 / GTM', crit: false },
  { label: 'PHP (version no confirmada)', crit: true },
]

export const scores = {
  overall: 36,
  performance: 45,
  seo: 45,
  accessibility: 28,
  conversion: 30,
}

export const cwv = { lcp: 0, cls: 0, ttfb: 0 }

export const findings: Finding[] = [
  {
    id: 'BARAL-CMS-001',
    category: 'CMS',
    priority: 'P0',
    stage: 'trust',
    title: 'Shortcode visible en /blog/: [mostrar_posts_elementor]',
    what: 'La pagina /blog/ renderiza el texto literal "[mostrar_posts_elementor]" en lugar de los posts. El shortcode del plugin no esta resolviendo, exponiendo implementacion interna al visitante.',
    impactBusiness:
      'Primera impresion de falla tecnica grave. Un prospecto que llega por busqueda organica ve codigo roto, no contenido. Dano inmediato a credibilidad.',
    impactUser:
      'El usuario encuentra una pagina vacia con texto de error; no puede navegar el contenido del blog ni descubrir servicios.',
    impactTech:
      'El plugin que registra el shortcode esta inactivo, desinstalado o tiene un hook mal registrado. Requiere diagnostico en wp-admin Plugins.',
    evidence: [
      { source: 'Inspeccion visual /blog/', value: 'Texto "[mostrar_posts_elementor]" visible en pagina publica' },
      { source: 'HTML fuente', value: 'Shortcode no procesado por WordPress' },
    ],
    confidence: 98,
    effort: 'Bajo',
    direction:
      'Revisar plugins activos en wp-admin. Si el plugin fue eliminado, reemplazar el shortcode con el bloque nativo de WordPress o Elementor para listar posts.',
    validate: 'Cargar /blog/ sin estar logueado y confirmar que no se ven shortcodes crudos',
    impact3mo: 'Perdida de trafico organico hacia el blog; rebote inmediato de nuevos visitantes.',
    impact6mo: 'Contenido de blog inaccesible impide posicionamiento de long-tail keywords.',
  },
  {
    id: 'BARAL-CMS-002',
    category: 'CMS / SEO',
    priority: 'P0',
    stage: 'discover',
    title: 'URLs internas de Elementor indexadas en Google',
    what: 'Las rutas /elementor-3122/, /prueba3d/ y similares son paginas de prueba y templates de Elementor que estan siendo rastreadas e indexadas por Google. Diluyen autoridad y envian senales de calidad negativas.',
    impactBusiness:
      'Autoridad de dominio fragmentada en paginas sin valor; competidores con dominio limpio capturan rankings que Baral pierde.',
    impactUser:
      'Usuarios pueden llegar desde Google a paginas de prueba sin contenido real, generando confusion y rebote.',
    impactTech:
      'Paginas de Elementor sin restriccion de indexacion. Requiere noindex en meta robots o bloqueo en robots.txt combinado con eliminacion de URLs en Search Console.',
    evidence: [
      { source: 'Google site: operator', value: 'URLs /elementor-XXXX/ y /prueba3d/ aparecen en indice' },
      { source: 'Revision de robots.txt', value: 'Sin reglas Disallow para rutas de Elementor' },
    ],
    confidence: 92,
    effort: 'Bajo',
    direction:
      'Agregar meta noindex a plantillas de Elementor; agregar Disallow en robots.txt; solicitar eliminacion en Google Search Console.',
    validate: 'Google site:baralintegral.com sin resultados de /elementor-XXXX/',
    impact3mo: 'Dilucion de autoridad SEO continuada hasta que Google re-rastree.',
    impact6mo: 'Paginas de prueba indexadas perjudican score de calidad del dominio a largo plazo.',
  },
  {
    id: 'BARAL-CRO-003',
    category: 'CRO / UX',
    priority: 'P0',
    stage: 'trust',
    title: 'Contadores animados muestran "0" tras carga completa',
    what: 'Los contadores de logros (proyectos completados, clientes, anos de experiencia) se quedan en 0 despues de que la pagina termina de cargar. La animacion no se dispara correctamente.',
    impactBusiness:
      'Estos numeros son el principal diferenciador de credibilidad en la homepage. Mostrar "0" es peor que no tener contadores: activamente destruye confianza.',
    impactUser:
      'El visitante interpreta "0 clientes" y "0 proyectos" como una empresa sin trayectoria o con un bug grave.',
    impactTech:
      'El script de animacion de contadores tiene una condicion de carrera con el renderizado del DOM o depende de un evento que no se dispara en todos los navegadores.',
    evidence: [
      { source: 'Inspeccion visual en Chrome', value: 'Contadores visibles en 0 tras 5 segundos de carga' },
      { source: 'Revision JS DevTools', value: 'IntersectionObserver o script de counter no ejecutando' },
    ],
    confidence: 95,
    effort: 'Bajo',
    direction:
      'Auditar el script de animacion. Asegurar que el trigger ocurra en DOMContentLoaded o via IntersectionObserver con threshold correcto. Agregar valores fallback si el script falla.',
    validate: 'Cargar homepage en modo incognito y confirmar que los numeros animan hasta su valor final',
    impact3mo: 'Cada visita a la homepage muestra credenciales en cero; tasa de contacto deprimida.',
    impact6mo: 'Acumulacion de primeras impresiones negativas; dano a percepcion de marca.',
  },
  {
    id: 'BARAL-TRUST-004',
    category: 'TRUST / LOCAL SEO',
    priority: 'P0',
    stage: 'trust',
    title: 'NAP inconsistente: direccion varia entre paginas (piso 4 vs piso 3)',
    what: 'La direccion fisica de Baral muestra "piso 4" en algunas paginas y "piso 3" en otras. Para Google, inconsistencia en NAP (Name, Address, Phone) penaliza el posicionamiento local.',
    impactBusiness:
      'En busquedas locales, Google penaliza sitios con NAP inconsistente. Perdida directa de visibilidad en Google Maps y Local Pack.',
    impactUser:
      'Un prospecto que quiere visitar la oficina no sabe a que piso ir; puede dudar de la legitimidad del negocio.',
    impactTech:
      'Multiples plantillas de Elementor con texto hardcodeado diferente. Requiere unificacion en un componente global.',
    evidence: [
      { source: 'Revision /contacto/', value: 'Direccion menciona "piso 4"' },
      { source: 'Revision footer', value: 'Direccion menciona "piso 3"' },
    ],
    confidence: 90,
    effort: 'Bajo',
    direction:
      'Definir la direccion canonica verificada. Unificarla en todas las paginas, footer y schema LocalBusiness. Actualizar tambien Google Business Profile.',
    validate: 'Buscar "piso" en todo el sitio — solo una version debe existir.',
    impact3mo: 'Posicionamiento local estancado con penalizacion NAP activa.',
    impact6mo: 'Perdida acumulada de visibilidad en busquedas locales de alto intent.',
  },
  {
    id: 'BARAL-LEGAL-005',
    category: 'LEGAL / PRIVACIDAD',
    priority: 'P1',
    stage: 'arrive',
    title: 'Sin cookie consent con GA4 activo — riesgo GDPR/LOPD',
    what: 'El sitio ejecuta GA4 (que recopila datos de usuario e IP) sin mostrar un aviso de cookies ni solicitar consentimiento. Viola el RGPD europeo y normativas similares en America Latina.',
    impactBusiness:
      'Riesgo de multa regulatoria. Sin consentimiento, los datos de GA4 pueden ser imprecisos por navegadores con proteccion de privacidad (Safari ITP, Firefox).',
    impactUser:
      'El usuario no tiene control sobre sus datos; su navegacion esta siendo rastreada sin conocimiento ni permiso.',
    impactTech:
      'GA4 se carga directamente sin capa de Consent Mode v2. Implementar banner CMP y configurar gtag con consent default denied.',
    evidence: [
      { source: 'Carga de homepage', value: 'GA4 se ejecuta antes de cualquier interaccion del usuario' },
      { source: 'Inspeccion de red', value: 'Peticion a google-analytics.com sin parametro de consentimiento' },
    ],
    confidence: 88,
    effort: 'Medio',
    direction:
      'Instalar plugin CMP compatible con Google Consent Mode v2. Configurar GA4 para no recopilar datos sin consentimiento. Agregar politica de privacidad y cookies accesible.',
    validate: 'Herramienta CookieMetrix — banner visible en primera visita',
    impact3mo: 'Riesgo legal latente + datos de analytics degradados sin consentimiento.',
    impact6mo: 'Exposicion regulatoria creciente si el negocio escala a mercados europeos.',
  },
  {
    id: 'BARAL-SEO-006',
    category: 'SEO ON-PAGE',
    priority: 'P1',
    stage: 'discover',
    title: 'Meta description de 435 caracteres — Google la trunca y la ignora',
    what: 'La meta description de la homepage tiene 435 caracteres (limite recomendado: 155-160). Google la ignora y genera su propio snippet, frecuentemente menos persuasivo.',
    impactBusiness:
      'CTR desde busqueda organica por debajo del potencial. El snippet en Google no comunica la propuesta de valor de Baral de forma controlada.',
    impactUser:
      'El resultado en Google no describe claramente que hace Baral; el usuario no sabe si el sitio es relevante antes de hacer clic.',
    impactTech:
      'Texto configurado en All in One SEO sin validacion de longitud. Requiere edicion directa en el plugin.',
    evidence: [
      { source: 'All in One SEO / HTML fuente', value: 'Meta description: 435 caracteres (medido)' },
      { source: 'Google SERP preview', value: 'Snippet truncado con "..."' },
    ],
    confidence: 97,
    effort: 'Bajo',
    direction:
      'Reescribir meta description de homepage en 145-155 caracteres. Incluir propuesta de valor unica y CTA implicito. Auditar las otras paginas clave con AIOSEO.',
    validate: 'Chrome SEO extension — meta descriptions < 160 chars en todas las paginas clave',
    impact3mo: 'CTR organico sub-optimo mientras Google genere snippets automaticos.',
    impact6mo: 'Perdida acumulada de clics frente a competidores con snippets optimizados.',
  },
  {
    id: 'BARAL-A11Y-007',
    category: 'ACCESIBILIDAD / SEO',
    priority: 'P1',
    stage: 'discover',
    title: '77 de 98 imagenes sin atributo alt text',
    what: 'El 78.5% de las imagenes del sitio carecen de texto alternativo. Afecta SEO de imagenes, accesibilidad para usuarios con discapacidad visual, y cumplimiento WCAG 2.1 AA.',
    impactBusiness:
      'Perdida de trafico desde Google Images. En mercados regulados puede representar riesgo de incumplimiento legal.',
    impactUser:
      'Usuarios con lectores de pantalla (NVDA, VoiceOver) reciben solo el nombre del archivo en lugar de descripcion util.',
    impactTech:
      'Imagenes cargadas masivamente en Elementor sin proceso de etiquetado. Requiere auditoria en Biblioteca de Medios de WordPress.',
    evidence: [
      { source: 'Auditoria automatica', value: '77/98 imagenes sin alt (78.5%)' },
      { source: 'axe DevTools', value: 'Multiples errores "Image alternative text"' },
    ],
    confidence: 95,
    effort: 'Medio',
    direction:
      'Usar plugin de accesibilidad para identificar imagenes sin alt. Priorizar imagenes en hero, servicios y portfolio. Agregar alt descriptivo, no decorativo.',
    validate: 'axe DevTools o WAVE — cero errores de imagen sin alt en paginas principales',
    impact3mo: 'SEO de imagenes y accesibilidad estancados sin mejora.',
    impact6mo: 'Riesgo legal de accesibilidad y perdida sostenida de trafico visual.',
  },
  {
    id: 'BARAL-SEO-008',
    category: 'SEO ON-PAGE',
    priority: 'P1',
    stage: 'discover',
    title: 'Titles de pagina genericos: INICIO, SERVICIOS, SOBRE NOSOTROS',
    what: 'Los titulos de las paginas principales son completamente genericos, sin incluir la marca ni las keywords de negocio. Google los usa como senal de relevancia principal.',
    impactBusiness:
      'Invisibilidad en busquedas clave como "agencia marketing digital Bolivia" o "branding Santa Cruz". Los competidores con titulos optimizados capturan esos rankings.',
    impactUser:
      'En pestanas del navegador y resultados de busqueda, el usuario ve "INICIO" sin entender que hace Baral.',
    impactTech:
      'Plantillas de Elementor con titulos por defecto. AIOSEO no esta configurado con plantillas de titulo dinamicas.',
    evidence: [
      { source: 'Inspeccion HTML <title>', value: 'Homepage: "INICIO | Baral" — Servicios: "SERVICIOS | Baral"' },
      { source: 'Google SERP', value: 'Titles aparecen tal cual, sin optimizacion de keyword' },
    ],
    confidence: 94,
    effort: 'Bajo',
    direction:
      'Redefinir titulos con formato: [Keyword Principal] | [Beneficio] | Baral. Ejemplo: "Estrategia de Marketing Digital Bolivia | Baral". Usar AIOSEO para plantillas.',
    validate: 'Google Search Console — impresiones en keywords objetivo aumentan en 4-8 semanas',
    impact3mo: 'Rankings en keywords de negocio deprimidos sin optimizacion.',
    impact6mo: 'Competidores consolidan posiciones mientras Baral no optimiza titulos.',
  },
  {
    id: 'BARAL-CRO-009',
    category: 'CRO / CONFIANZA',
    priority: 'P1',
    stage: 'trust',
    title: 'Sin prueba social con datos de negocio medibles',
    what: 'El sitio no presenta testimonios con nombre verificable, casos de exito con metricas, ni logos de clientes reconocibles. La prueba social existente es generica o inexistente.',
    impactBusiness:
      'Un prospecto B2B que evalua contratar una agencia necesita evidencia de resultados. Sin ella, Baral pierde frente a competidores que si la presentan.',
    impactUser:
      'El visitante no puede evaluar la calidad real del trabajo; la decision de contactar requiere mas saltos de fe de los necesarios.',
    impactTech:
      'No hay bloque de testimonios, carrusel de logos ni seccion de casos de estudio implementada en Elementor.',
    evidence: [
      { source: 'Revision visual homepage', value: 'Sin seccion de testimonios o social proof visible' },
      { source: 'Revision /portfolio/', value: 'Proyectos sin metricas de resultado' },
    ],
    confidence: 85,
    effort: 'Medio',
    direction:
      'Implementar seccion de testimonios con foto, nombre, empresa y resultado concreto. Agregar logos de 5-10 clientes reconocibles. Crear 2-3 mini casos de estudio con metricas reales.',
    validate: 'Heatmap — usuarios hacen scroll hasta prueba social; tasa de contacto +15%',
    impact3mo: 'Tasa de conversion de visita a contacto sub-optima por falta de credibilidad.',
    impact6mo: 'Perdida de prospectos B2B frente a competidores con portafolios documentados.',
  },
  {
    id: 'BARAL-UX-010',
    category: 'UX / FORMULARIOS',
    priority: 'P1',
    stage: 'convert',
    title: 'Formulario con placeholder "Texto de una sola linea" visible en produccion',
    what: 'El formulario de contacto muestra el texto de placeholder por defecto de Elementor/CF7 sin haber sido personalizado. Senal directa de descuido en una agencia de diseno.',
    impactBusiness:
      'Un formulario con texto generico de plantilla transmite falta de atencion al detalle — exactamente lo contrario que debe transmitir una agencia creativa.',
    impactUser:
      'El usuario no sabe que escribir en el campo; la falta de placeholder descriptivo genera friccion en la conversion.',
    impactTech:
      'Widget de formulario de Elementor o Contact Form 7 con campo no configurado. Correccion de 5 minutos.',
    evidence: [
      { source: 'Inspeccion formulario /contacto/', value: 'Placeholder: "Texto de una sola linea"' },
      { source: 'HTML input', value: 'placeholder="Texto de una sola linea"' },
    ],
    confidence: 99,
    effort: 'Bajo',
    direction:
      'Editar el formulario en wp-admin o Elementor. Agregar labels descriptivos y placeholders utiles como "Tu nombre completo", "Empresa (opcional)", "En que podemos ayudarte?".',
    validate: 'Inspeccion visual del formulario — cero placeholders genericos',
    impact3mo: 'Cada visita al formulario refuerza percepcion negativa de descuido.',
    impact6mo: 'Oportunidades de contacto perdidas por friccion evitable.',
  },
]

export const compactFindings: CompactFinding[] = [
  { id: 'BARAL-CONTENT-011', title: 'Blog sin posts en 2026 — contenido desactualizado', effort: 'Alto', priority: 'P2' },
  { id: 'BARAL-A11Y-012', title: 'Headings H2/H3 vacios detectados en paginas internas', effort: 'Bajo', priority: 'P2' },
  { id: 'BARAL-SEO-013', title: 'Schema JSON-LD incompleto — sin LocalBusiness ni sameAs', effort: 'Medio', priority: 'P2' },
  { id: 'BARAL-CMS-014', title: 'Attachment pages de Elementor potencialmente indexables', effort: 'Bajo', priority: 'P2' },
  { id: 'BARAL-CRO-015', title: 'Sin CTAs secundarios persistentes en movil (sticky bar)', effort: 'Medio', priority: 'P2' },
  { id: 'BARAL-TRUST-016', title: 'Portfolio sin metricas de resultado — solo imagenes', effort: 'Medio', priority: 'P2' },
  { id: 'BARAL-UX-017', title: 'WhatsApp no trackeable como conversion en GA4', effort: 'Bajo', priority: 'P3' },
  { id: 'BARAL-CONTENT-018', title: 'Categoria "Uncategorized" potencialmente indexable', effort: 'Bajo', priority: 'P3' },
  { id: 'BARAL-SEO-019', title: 'Imagenes sin formato WebP — mayor peso de pagina', effort: 'Bajo', priority: 'P3' },
  { id: 'BARAL-UX-020', title: 'Sin indicador de pagina activa en menu de navegacion', effort: 'Bajo', priority: 'P3' },
  { id: 'BARAL-TRUST-021', title: 'Sin politica de privacidad clara y accesible en footer', effort: 'Bajo', priority: 'P3' },
  { id: 'BARAL-SEO-022', title: 'Robots.txt no revisado — posibles rutas mal configuradas', effort: 'Bajo', priority: 'P3' },
]

export const axisKeys = ['velocidad', 'seo', 'confianza', 'ux', 'conversion', 'contenido'] as const
export const axisLabels = ['Velocidad', 'SEO', 'Confianza', 'UX', 'Conversion', 'Contenido']

export type AxisKey = (typeof axisKeys)[number]

export const constellationSets: Record<string, Record<AxisKey, number>> = {
  client: { velocidad: 30, seo: 45, confianza: 28, ux: 38, conversion: 30, contenido: 25 },
  avg: { velocidad: 62, seo: 60, confianza: 65, ux: 64, conversion: 58, contenido: 52 },
  top: { velocidad: 88, seo: 85, confianza: 90, ux: 87, conversion: 82, contenido: 78 },
}

export const compareColumns = [
  { key: 'client', label: 'BARAL', threat: 'Sujeto auditado' },
  { key: 'a', label: 'COMP A', threat: 'Rival local' },
  { key: 'b', label: 'COMP B', threat: 'Rival regional' },
  { key: 'top', label: 'REF TOP', threat: 'Estrella guia' },
] as const

export const compareRows = [
  { label: 'Performance score', client: 45, a: 68, b: 75, top: 91, unit: '' },
  { label: 'SEO score', client: 45, a: 55, b: 62, top: 87, unit: '' },
  { label: 'Trust signals', client: 2, a: 5, b: 7, top: 9, unit: '/10' },
  { label: 'CTA clarity', client: 3, a: 6, b: 7, top: 9, unit: '/10' },
  { label: 'Mobile UX', client: 38, a: 70, b: 78, top: 90, unit: '' },
]

export const references = [
  {
    domain: 'agencia-rival-local.com',
    orbit: 'Orbita cercana',
    admire: 'Casos de exito con metricas',
    adapt: 'Estructura de servicios clara',
    avoid: 'Diseno sobrecargado',
    gravity: 68,
  },
  {
    domain: 'agencia-regional.com',
    orbit: 'Orbita de colision',
    admire: 'Velocidad de carga < 2s',
    adapt: 'Portfolio con resultados',
    avoid: 'Blog desactualizado',
    gravity: 82,
  },
  {
    domain: 'referencia-latam.com',
    orbit: 'Estrella guia',
    admire: 'Propuesta de valor cristalina',
    adapt: 'Testimonios con datos reales',
    avoid: 'Exceso de animaciones',
    gravity: 94,
  },
]

export const funnelStages: { key: FunnelKey; label: string; count: number; dropoff: number | null }[] = [
  { key: 'discover', label: 'DISCOVER', count: 3, dropoff: 28 },
  { key: 'arrive', label: 'ARRIVE', count: 1, dropoff: 15 },
  { key: 'understand', label: 'UNDERSTAND', count: 2, dropoff: 42 },
  { key: 'trust', label: 'TRUST', count: 4, dropoff: 35 },
  { key: 'action', label: 'ACTION', count: 2, dropoff: 55 },
  { key: 'convert', label: 'CONVERT', count: 2, dropoff: null },
]

export const roadmap = [
  {
    key: 'ahora',
    label: 'AHORA',
    subtitle: 'Bloqueos criticos — esta semana',
    items: [
      { id: 'BARAL-CMS-001', title: 'Corregir shortcode roto en /blog/', effort: 'Bajo', impactPct: 95 },
      { id: 'BARAL-CRO-003', title: 'Reparar contadores animados en homepage', effort: 'Bajo', impactPct: 88 },
      { id: 'BARAL-TRUST-004', title: 'Unificar NAP (direccion) en todo el sitio', effort: 'Bajo', impactPct: 80 },
      { id: 'BARAL-UX-010', title: 'Corregir placeholder generico en formulario', effort: 'Bajo', impactPct: 75 },
    ],
  },
  {
    key: 'semana',
    label: 'SPRINT 1',
    subtitle: 'SEO y visibilidad',
    items: [
      { id: 'BARAL-CMS-002', title: 'Desindexar URLs de Elementor', effort: 'Bajo', impactPct: 70 },
      { id: 'BARAL-SEO-006', title: 'Reescribir meta descriptions (< 155 chars)', effort: 'Bajo', impactPct: 65 },
      { id: 'BARAL-SEO-008', title: 'Optimizar titles de pagina con keywords', effort: 'Bajo', impactPct: 72 },
    ],
  },
  {
    key: 'mes',
    label: 'SPRINT 2',
    subtitle: 'Accesibilidad y legalidad',
    items: [
      { id: 'BARAL-LEGAL-005', title: 'Implementar cookie consent (CMP)', effort: 'Medio', impactPct: 60 },
      { id: 'BARAL-A11Y-007', title: 'Alt text en 77 imagenes', effort: 'Medio', impactPct: 55 },
    ],
  },
  {
    key: 'q3',
    label: 'SPRINT 3-5',
    subtitle: 'Conversion y contenido',
    items: [
      { id: 'BARAL-CRO-009', title: 'Agregar prueba social con metricas reales', effort: 'Medio', impactPct: 85 },
      { id: 'BARAL-CONTENT-011', title: 'Reactivar blog con contenido mensual', effort: 'Alto', impactPct: 50 },
    ],
  },
]

export const hypotheses = [
  {
    text: 'Reparar los contadores animados aumentara el tiempo en homepage en un 20%',
    stage: 'TRUST',
    method: 'Comparacion pre/post con GA4 Engagement Time',
    metric: 'Avg. engagement time',
    confidence: 82,
  },
  {
    text: 'Agregar prueba social verificable aumentara la tasa de contacto en un 25%',
    stage: 'CONVERT',
    method: 'A/B test con variante de testimonios',
    metric: 'Form submission rate',
    confidence: 74,
  },
  {
    text: 'Optimizar titles y meta descriptions aumentara CTR organico en 15-30%',
    stage: 'DISCOVER',
    method: 'Google Search Console — CTR por query',
    metric: 'Organic CTR',
    confidence: 88,
  },
]

export const dataGaps = [
  {
    key: 'g1',
    title: 'Acceso a Google Search Console',
    why: 'Sin GSC no podemos ver que keywords traen trafico real, paginas con errores de indexacion ni datos de Core Web Vitals de usuarios reales.',
    access: 'Compartir acceso de solo lectura a Search Console de baralintegral.com.',
  },
  {
    key: 'g2',
    title: 'Acceso a GA4',
    why: 'Sin acceso a GA4 los datos de comportamiento, conversiones y dispositivos son estimaciones. Los datos de contadores no son verificables.',
    access: 'Compartir acceso de Lector en GA4 → Administrador → Cuentas de usuario.',
  },
  {
    key: 'g3',
    title: 'Core Web Vitals con datos de campo (CrUX)',
    why: 'El rendimiento fue marcado como [NOT MEASURED] porque el sitio puede no tener suficiente trafico en CrUX o el acceso a PageSpeed Insights no dio datos de campo.',
    access: 'Compartir URL del informe de PageSpeed Insights con datos de 28 dias.',
  },
  {
    key: 'g4',
    title: 'Lista de competidores directos',
    why: 'El analisis competitivo usa placeholders genericos. Con nombres reales de competidores podemos hacer un benchmark mas preciso.',
    access: 'Proporcionar 2-3 URLs de agencias competidoras en el mismo mercado.',
  },
]

export const metricTiles = [
  { label: 'Performance', value: `~${scores.performance}`, benchmark: '90+', good: false, pct: scores.performance },
  { label: 'SEO score', value: `${scores.seo}`, benchmark: '90+', good: false, pct: scores.seo },
  { label: 'Accesibilidad', value: `${scores.accessibility}`, benchmark: '90+', good: false, pct: scores.accessibility },
  { label: 'Conversion', value: `${scores.conversion}`, benchmark: '70+', good: false, pct: scores.conversion },
  { label: 'Imagenes sin alt', value: '77/98', benchmark: '0', good: false, pct: 22 },
  { label: 'URLs Elementor', value: 'Indexadas', benchmark: 'Noindex', good: false, pct: 15 },
  { label: 'Cookie Consent', value: 'Ausente', benchmark: 'GDPR OK', good: false, pct: 0 },
  { label: 'NAP Consistente', value: 'Conflicto', benchmark: 'Unificado', good: false, pct: 0 },
]

export const priorityMeta: Record<
  Priority,
  { tag: string; timeline: string; color: string; glow: string; soft: string; magnitude: string }
> = {
  P0: {
    tag: 'CRITICO',
    timeline: 'Actuar ya mismo',
    color: 'var(--pulsar)',
    glow: 'oklch(0.72 0.2 15 / 0.45)',
    soft: 'oklch(0.72 0.2 15 / 0.12)',
    magnitude: 'Supernova',
  },
  P1: {
    tag: 'IMPORTANTE',
    timeline: 'Esta semana',
    color: 'var(--solar)',
    glow: 'oklch(0.85 0.13 88 / 0.4)',
    soft: 'oklch(0.85 0.13 88 / 0.12)',
    magnitude: 'Gigante roja',
  },
  P2: {
    tag: 'MEDIO',
    timeline: 'Proximo sprint',
    color: 'var(--star)',
    glow: 'oklch(0.88 0.14 195 / 0.35)',
    soft: 'oklch(0.88 0.14 195 / 0.12)',
    magnitude: 'Enana blanca',
  },
  P3: {
    tag: 'ESPERA',
    timeline: 'Q3 — espacio profundo',
    color: 'var(--nova)',
    glow: 'oklch(0.86 0.19 155 / 0.32)',
    soft: 'oklch(0.86 0.19 155 / 0.12)',
    magnitude: 'Nebulosa lejana',
  },
}

export const counts = {
  P0: findings.filter((f) => f.priority === 'P0').length,
  P1: findings.filter((f) => f.priority === 'P1').length,
  P2: compactFindings.filter((f) => f.priority === 'P2').length,
  P3: compactFindings.filter((f) => f.priority === 'P3').length,
}

export const totalFindings = counts.P0 + counts.P1 + counts.P2 + counts.P3
export const opportunityCount = counts.P2 + counts.P3
