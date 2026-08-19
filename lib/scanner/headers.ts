/**
 * Auditoría de cabeceras de seguridad.
 *
 * `RawScan.headers` ya guardaba la respuesta completa del servidor y ningún
 * heurístico la miraba. Estos chequeos no cuestan una sola petición extra.
 *
 * Fuente de los umbrales: OWASP Secure Headers Project.
 */

export type HeaderSeverity = 'alta' | 'media' | 'baja'

export interface HeaderCheck {
  key: string
  label: string
  present: boolean
  value: string | null
  severity: HeaderSeverity
  why: string
  source: string
}

const OWASP = 'OWASP Secure Headers Project'

interface HeaderSpec {
  key: string
  label: string
  severity: HeaderSeverity
  why: string
  /** solo aplica sobre HTTPS */
  httpsOnly?: boolean
}

const EXPECTED: HeaderSpec[] = [
  {
    key: 'strict-transport-security',
    label: 'HSTS',
    severity: 'alta',
    httpsOnly: true,
    why: 'Obliga al navegador a usar HTTPS en todas las visitas siguientes. Sin esta cabecera, la primera visita puede interceptarse aunque el sitio tenga certificado.',
  },
  {
    key: 'content-security-policy',
    label: 'Content-Security-Policy',
    severity: 'media',
    why: 'Declara de qué orígenes puede cargarse el contenido. Es la defensa principal contra la inyección de scripts de terceros.',
  },
  {
    key: 'x-content-type-options',
    label: 'X-Content-Type-Options',
    severity: 'media',
    why: 'Impide que el navegador adivine el tipo de un archivo. Sin ella, un archivo subido por un usuario puede ejecutarse como script.',
  },
  {
    key: 'x-frame-options',
    label: 'X-Frame-Options',
    severity: 'media',
    why: 'Impide que el sitio se cargue dentro de un iframe ajeno, que es la base del clickjacking.',
  },
  {
    key: 'referrer-policy',
    label: 'Referrer-Policy',
    severity: 'baja',
    why: 'Controla cuánta información de la URL de origen se envía al navegar hacia fuera. Sin ella pueden filtrarse rutas internas.',
  },
  {
    key: 'permissions-policy',
    label: 'Permissions-Policy',
    severity: 'baja',
    why: 'Declara qué APIs del navegador (cámara, micrófono, geolocalización) puede usar la página y sus iframes.',
  },
]

/** Cabeceras que revelan el stack y su versión: facilitan buscar exploits conocidos. */
const LEAKY: { key: string; label: string }[] = [
  { key: 'x-powered-by', label: 'X-Powered-By' },
  { key: 'x-aspnet-version', label: 'X-AspNet-Version' },
  { key: 'x-generator', label: 'X-Generator' },
]

function lower(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) out[k.toLowerCase()] = v
  return out
}

export function auditSecurityHeaders(headers: Record<string, string>, isHttps: boolean): HeaderCheck[] {
  const h = lower(headers)

  return EXPECTED
    .filter(spec => !spec.httpsOnly || isHttps)
    .map(spec => ({
      key: spec.key,
      label: spec.label,
      present: h[spec.key] !== undefined,
      value: h[spec.key] ?? null,
      severity: spec.severity,
      why: spec.why,
      source: OWASP,
    }))
}

export interface HeaderLeak {
  key: string
  label: string
  value: string
}

/** Cabeceras presentes que exponen tecnología y versión. */
export function detectHeaderLeaks(headers: Record<string, string>): HeaderLeak[] {
  const h = lower(headers)
  const out: HeaderLeak[] = []

  for (const { key, label } of LEAKY) {
    if (h[key]) out.push({ key, label, value: h[key] })
  }

  // `Server: nginx` es inocuo; `Server: nginx/1.18.0` señala qué exploits probar.
  const server = h['server']
  if (server && /\d+\.\d+/.test(server)) {
    out.push({ key: 'server', label: 'Server', value: server })
  }

  return out
}

/** Puntaje 0–100 de cumplimiento, ponderado por severidad. */
export function headerScore(checks: HeaderCheck[]): number {
  if (!checks.length) return 0
  const weight = (s: HeaderSeverity) => (s === 'alta' ? 3 : s === 'media' ? 2 : 1)
  const total = checks.reduce((a, c) => a + weight(c.severity), 0)
  const got = checks.reduce((a, c) => a + (c.present ? weight(c.severity) : 0), 0)
  return Math.round((got / total) * 100)
}
