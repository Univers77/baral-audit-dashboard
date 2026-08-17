'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <head />
      <body style={{ background: '#0a0b14', color: '#e2e8f0', fontFamily: 'sans-serif', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Algo salió mal.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
