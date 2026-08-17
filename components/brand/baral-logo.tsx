/**
 * Marca Baral — extraída del arte oficial con canal alfa por luminancia.
 *
 * Dos variantes:
 *  · mark   — solo el monograma, para espacios reducidos (nav, favicon, avatar)
 *  · lockup — monograma + "baral" + bajada, para cierres y portadas
 *
 * El arte original ya incorpora su propio halo, así que NO se le añaden
 * sombras ni glows por CSS: duplicarlos hace que el logo "flote" y se
 * despegue del fondo.
 */

type Variant = 'mark' | 'lockup'

const SRC: Record<Variant, { webp: string; png: string; w: number; h: number }> = {
  mark:   { webp: '/baral-mark.webp',   png: '/baral-mark.png',   w: 256, h: 256 },
  lockup: { webp: '/baral-lockup.webp', png: '/baral-lockup.png', w: 400, h: 364 },
}

export function BaralLogo({
  variant = 'mark',
  height,
  className,
  priority = false,
}: {
  variant?: Variant
  /** Alto en px. El ancho se deriva del ratio original. */
  height: number
  className?: string
  priority?: boolean
}) {
  const s = SRC[variant]
  const width = Math.round((height * s.w) / s.h)

  return (
    <picture className={className}>
      <source srcSet={s.webp} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={s.png}
        alt="Baral — Estrategia Integral Creativa"
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        style={{ width, height, display: 'block', objectFit: 'contain' }}
      />
    </picture>
  )
}
