/** @type {import('next').NextConfig} */

// Cabeceras de defensa básica. No se define Content-Security-Policy todavía:
// el dashboard carga Google Identity Services, Vercel Analytics e imágenes
// remotas, y una CSP mal calibrada rompe el login de GA4. El camino correcto
// es introducirla primero como Content-Security-Policy-Report-Only.
const securityHeaders = [
  // Impide que el navegador reinterprete el tipo declarado de una respuesta.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // El informe puede enlazar sitios auditados: no filtrar la URL completa.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
]

const nextConfig = {
  typescript: {
    // El typecheck pasa limpio; dejar que un error de tipos bloquee el deploy.
    ignoreBuildErrors: false,
  },
  // Nota: la clave `eslint` se retiró porque Next.js 16 ya no la admite —
  // emitía un aviso de configuración inválida y no tenía efecto. El lint se
  // ejecuta aparte con `pnpm lint` (pendiente migrar la config al formato flat
  // que exige ESLint 10).
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@anthropic-ai/sdk'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
