import dns from 'node:dns/promises'
import net from 'node:net'

/**
 * Gateway único de salida de red para URLs elegidas por el usuario.
 *
 * Esta app existe para que el servidor visite sitios que un visitante indica,
 * lo cual es exactamente la superficie que habilita SSRF: sin control, un
 * atacante puede usarla para tocar `localhost`, IPs de red privada o el
 * endpoint de metadata de la nube (169.254.169.254) desde dentro de la
 * infraestructura de Vercel. Todo fetch de una URL de usuario debe pasar por
 * `safeFetchText` / `safeFetchBuffer` / `safeFetchOk` — nunca `fetch()` directo.
 *
 * Defensa aplicada: resolver DNS y bloquear si CUALQUIER IP resuelta es
 * privada/reservada, repitiendo la validación en cada salto de redirect
 * (manual, no automático). No pinea la IP resuelta al socket real de la
 * conexión TLS, así que queda un margen residual de TOCTOU/DNS rebinding
 * entre la validación y el fetch — mitigarlo del todo requiere un Agent con
 * `lookup` custom a nivel de conexión; ver nota en el informe de auditoría.
 */

export class UnsafeUrlError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'UnsafeUrlError'
  }
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const DEFAULT_TEXT_MAX_BYTES = 8 * 1024 * 1024   // 8 MB — generoso para HTML real
const DEFAULT_BUFFER_MAX_BYTES = 15 * 1024 * 1024 // 15 MB — capturas/imágenes

// ── IPv4 ──────────────────────────────────────────────────────────────────

function ipv4ToLong(ip: string): number {
  const parts = ip.split('.').map(Number)
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function inCidr4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return (ipv4ToLong(ip) & mask) === (ipv4ToLong(base) & mask)
}

// RFC 1918/5735/6598 + link-local (incluye metadata cloud 169.254.169.254) +
// loopback + multicast/reservado + rangos de documentación/testing.
const PRIVATE_V4_RANGES: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]

function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_V4_RANGES.some(([base, bits]) => inCidr4(ip, base, bits))
}

// ── IPv6 ──────────────────────────────────────────────────────────────────

function expandIPv6(ip: string): string[] {
  if (!ip.includes('::')) return ip.split(':')
  const [head, tail] = ip.split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const missing = 8 - headParts.length - tailParts.length
  return [...headParts, ...Array(Math.max(missing, 0)).fill('0'), ...tailParts]
}

/** Ocho grupos de 16 bits. Se comparan por grupo para no depender de BigInt. */
function ipv6Groups(ip: string): number[] {
  return expandIPv6(ip).map(p => parseInt(p || '0', 16) || 0)
}

function ipv6InCidr(ip: string, base: string, bits: number): boolean {
  const a = ipv6Groups(ip)
  const b = ipv6Groups(base)
  if (a.length !== 8 || b.length !== 8) return false

  let remaining = bits
  for (let i = 0; i < 8 && remaining > 0; i++) {
    const take = Math.min(16, remaining)
    const mask = take === 16 ? 0xffff : (0xffff << (16 - take)) & 0xffff
    if ((a[i] & mask) !== (b[i] & mask)) return false
    remaining -= take
  }
  return true
}

// loopback, no especificada, link-local, unique-local (privada), multicast,
// y el rango de IPv4-mapeada (::ffff:0:0/96) como defensa en profundidad —
// el caso textual común (::ffff:a.b.c.d) ya se desenreda aparte más abajo.
const PRIVATE_V6_RANGES: [string, number][] = [
  ['::1', 128],
  ['::', 128],
  ['fe80::', 10],
  ['fc00::', 7],
  ['ff00::', 8],
  ['::ffff:0:0', 96],
]

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase()
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIPv4(mapped[1])
  try {
    return PRIVATE_V6_RANGES.some(([base, bits]) => ipv6InCidr(normalized, base, bits))
  } catch {
    return true // si no se puede interpretar, se rechaza — fail closed
  }
}

/** Exportada para poder fijarla con tests: es la regla central del gateway. */
export function isPrivateIp(ip: string): boolean {
  const type = net.isIP(ip)
  if (type === 4) return isPrivateIPv4(ip)
  if (type === 6) return isPrivateIPv6(ip)
  return true // dirección no reconocida → no confiar
}

// ── Validación de URL + DNS ─────────────────────────────────────────────

async function assertSafeUrl(urlString: string): Promise<URL> {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    throw new UnsafeUrlError('URL inválida', 'INVALID_URL')
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new UnsafeUrlError(`Protocolo no permitido: ${parsed.protocol}`, 'BAD_PROTOCOL')
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError('No se permiten credenciales embebidas en la URL', 'CREDENTIALS_IN_URL')
  }

  let resolved: { address: string }[]
  try {
    resolved = await dns.lookup(parsed.hostname, { all: true, verbatim: true })
  } catch {
    throw new UnsafeUrlError('No se pudo resolver el host de destino', 'DNS_FAILED')
  }
  if (resolved.length === 0) {
    throw new UnsafeUrlError('El host no resolvió a ninguna dirección', 'DNS_EMPTY')
  }
  if (resolved.some(r => isPrivateIp(r.address))) {
    throw new UnsafeUrlError('El destino resuelve a una dirección de red privada o reservada', 'PRIVATE_DESTINATION')
  }

  return parsed
}

// ── Fetch con redirects manuales re-validados + límite de bytes ──────────

export interface SafeFetchOptions {
  headers?: Record<string, string>
  timeoutMs?: number
  maxRedirects?: number
  maxBytes?: number
}

async function fetchFollowingSafely(initialUrl: string, opts: SafeFetchOptions): Promise<Response> {
  const { headers = {}, timeoutMs = 15_000, maxRedirects = 5 } = opts
  let currentUrl = initialUrl

  for (let hop = 0; ; hop++) {
    const validated = await assertSafeUrl(currentUrl)
    const res = await fetch(validated, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    })

    const isRedirect = res.status >= 300 && res.status < 400
    const location = res.headers.get('location')
    if (isRedirect && location) {
      await res.body?.cancel().catch(() => {})
      if (hop >= maxRedirects) {
        throw new UnsafeUrlError('Demasiadas redirecciones', 'TOO_MANY_REDIRECTS')
      }
      currentUrl = new URL(location, validated).toString()
      continue
    }
    return res
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer().catch(() => new ArrayBuffer(0)))
    return { bytes: buf, truncated: false }
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  let truncated = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      const allowed = value.byteLength - (total - maxBytes)
      if (allowed > 0) chunks.push(value.subarray(0, allowed))
      truncated = true
      await reader.cancel().catch(() => {})
      break
    }
    chunks.push(value)
  }
  const combined = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let offset = 0
  for (const c of chunks) { combined.set(c, offset); offset += c.length }
  return { bytes: combined, truncated }
}

export interface SafeFetchTextResult {
  status: number
  headers: Headers
  url: string
  bodyText: string
  truncated: boolean
}

/** Para HTML u otro texto — el uso principal del scanner. */
export async function safeFetchText(url: string, opts: SafeFetchOptions = {}): Promise<SafeFetchTextResult> {
  const res = await fetchFollowingSafely(url, opts)
  const { bytes, truncated } = await readCapped(res, opts.maxBytes ?? DEFAULT_TEXT_MAX_BYTES)
  return {
    status: res.status,
    headers: res.headers,
    url: res.url || url,
    bodyText: new TextDecoder('utf-8', { fatal: false }).decode(bytes),
    truncated,
  }
}

export interface SafeFetchBufferResult {
  status: number
  contentType: string
  buffer: Buffer
  url: string
  truncated: boolean
}

/** Para binarios (proxy de imágenes). Rechaza tempranamente si Content-Length ya declara exceso. */
export async function safeFetchBuffer(url: string, opts: SafeFetchOptions = {}): Promise<SafeFetchBufferResult> {
  const maxBytes = opts.maxBytes ?? DEFAULT_BUFFER_MAX_BYTES
  const res = await fetchFollowingSafely(url, opts)

  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > maxBytes) {
    await res.body?.cancel().catch(() => {})
    throw new UnsafeUrlError('La respuesta declara un tamaño mayor al permitido', 'RESPONSE_TOO_LARGE')
  }

  const { bytes, truncated } = await readCapped(res, maxBytes)
  return {
    status: res.status,
    contentType: res.headers.get('content-type') ?? 'application/octet-stream',
    buffer: Buffer.from(bytes),
    url: res.url || url,
    truncated,
  }
}

/** Solo para checks de existencia (robots.txt/sitemap.xml/llms.txt) — descarta el cuerpo. */
export async function safeFetchOk(url: string, opts: SafeFetchOptions = {}): Promise<boolean> {
  try {
    const res = await fetchFollowingSafely(url, opts)
    await res.body?.cancel().catch(() => {})
    return res.ok
  } catch {
    return false
  }
}

/**
 * Código de estado sin descargar el cuerpo.
 *
 * Distinto de safeFetchOk: para reportar un enlace roto no basta saber que
 * falló, hace falta separar un 404 real de un servidor caído o de un destino
 * que simplemente no responde a nuestro user-agent.
 *
 * `null` significa que no hubo respuesta HTTP: destino bloqueado por el
 * gateway, DNS que no resuelve, o expiración del plazo.
 */
export async function safeFetchStatus(url: string, opts: SafeFetchOptions = {}): Promise<number | null> {
  try {
    const res = await fetchFollowingSafely(url, opts)
    await res.body?.cancel().catch(() => {})
    return res.status
  } catch {
    return null
  }
}
