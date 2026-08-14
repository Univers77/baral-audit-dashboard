'use client'

export const dynamic = 'force-dynamic'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ background: '#0a0b14', color: '#e2e8f0', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Algo salió mal</h2>
        <button
          onClick={reset}
          style={{ padding: '0.5rem 1.25rem', background: '#00d4ff', color: '#0a0b14', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
