'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Tablet, ExternalLink, ImageOff } from 'lucide-react'
import type { DeviceShots, DeviceKey } from '@/lib/scanner/types'

type LoadState = 'loading' | 'ok' | 'error'

const DEVICES: {
  key: DeviceKey
  label: string
  viewport: string
  icon: typeof Monitor
  /** ancho/alto reales del viewport capturado — define el aspect ratio del marco */
  w: number
  h: number
}[] = [
  { key: 'mobile',  label: 'Móvil',      viewport: '390 × 844',  icon: Smartphone, w: 390,  h: 844 },
  { key: 'tablet',  label: 'Tablet',     viewport: '820 × 1180', icon: Tablet,     w: 820,  h: 1180 },
  { key: 'desktop', label: 'Escritorio', viewport: '1440 × 900', icon: Monitor,    w: 1440, h: 900 },
]

/** Alto común de los marcos verticales para que móvil y tablet se vean alineados. */
const STAGE_H = 400

function Shot({
  src,
  alt,
  state,
  onState,
  className,
}: {
  src: string
  alt: string
  state: LoadState
  onState: (s: LoadState) => void
  className?: string
}) {
  return (
    <>
      {state === 'loading' && (
        <div className="absolute inset-0 grid place-items-center" style={{ background: '#0a0b14' }}>
          <div
            className="size-6 rounded-full border-2 motion-safe:animate-spin motion-reduce:animate-none"
            style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: '#7C3AED' }}
          />
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 grid place-items-center gap-1.5" style={{ background: '#0a0b14' }}>
          <ImageOff className="mx-auto size-5" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Render no disponible
          </span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => onState('ok')}
        onError={() => onState('error')}
        className={className}
        style={{ opacity: state === 'ok' ? 1 : 0, transition: 'opacity .35s ease' }}
      />
    </>
  )
}

export function DeviceRendering({ shots, domain }: { shots: DeviceShots; domain: string }) {
  const [states, setStates] = useState<Record<DeviceKey, LoadState>>({
    mobile: 'loading',
    tablet: 'loading',
    desktop: 'loading',
  })

  const set = (k: DeviceKey) => (s: LoadState) => setStates(v => (v[k] === s ? v : { ...v, [k]: s }))

  const mobile = DEVICES[0]
  const tablet = DEVICES[1]
  const desktop = DEVICES[2]

  return (
    <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          RENDER POR DISPOSITIVO
        </p>
        <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          captura real · viewport de cada dispositivo
        </span>
      </div>
      <p className="mb-5 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        Cada captura se toma con el viewport y el user-agent del dispositivo, así se activan los breakpoints
        responsive reales del sitio. Si los tres se ven idénticos, el sitio no está adaptando su layout.
      </p>

      {/* ── Escritorio: ventana de navegador ── */}
      <figure className="mb-5">
        <div
          className="overflow-hidden rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.10)', background: '#13142a' }}
        >
          {/* barra del navegador */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex shrink-0 gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="size-2.5 rounded-full" style={{ background: '#febc2e' }} />
              <span className="size-2.5 rounded-full" style={{ background: '#28c840' }} />
            </div>
            <div
              className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2.5 py-1"
              style={{ background: '#0a0b1e', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="truncate font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {domain}
              </span>
            </div>
          </div>
          <div className="relative w-full" style={{ aspectRatio: `${desktop.w} / ${desktop.h}`, background: '#0a0b14' }}>
            <Shot
              src={shots.desktop}
              alt={`Render de ${domain} en escritorio, viewport ${desktop.viewport}`}
              state={states.desktop}
              onState={set('desktop')}
              className="absolute inset-0 size-full object-cover object-top"
            />
          </div>
        </div>
        <figcaption className="mt-2 flex items-center gap-2 font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <Monitor className="size-3" aria-hidden /> ESCRITORIO · {desktop.viewport}
        </figcaption>
      </figure>

      {/* ── Móvil + Tablet ── */}
      <div className="flex flex-wrap items-end justify-center gap-6 sm:justify-start">
        {/* Móvil */}
        <figure className="flex flex-col items-center">
          <div
            className="relative overflow-hidden"
            style={{
              height: STAGE_H,
              width: STAGE_H * (mobile.w / mobile.h),
              borderRadius: 26,
              background: '#000',
              padding: 5,
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 12px 34px -12px rgba(0,0,0,0.85)',
            }}
          >
            {/* dynamic island */}
            <span
              aria-hidden
              className="absolute left-1/2 z-10 -translate-x-1/2 rounded-full"
              style={{ top: 11, width: 42, height: 7, background: '#000' }}
            />
            <div className="relative size-full overflow-hidden" style={{ borderRadius: 21, background: '#0a0b14' }}>
              <Shot
                src={shots.mobile}
                alt={`Render de ${domain} en móvil, viewport ${mobile.viewport}`}
                state={states.mobile}
                onState={set('mobile')}
                className="absolute inset-0 size-full object-cover object-top"
              />
            </div>
          </div>
          <figcaption className="mt-2 flex items-center gap-1.5 font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Smartphone className="size-3" aria-hidden /> MÓVIL · {mobile.viewport}
          </figcaption>
        </figure>

        {/* Tablet */}
        <figure className="flex flex-col items-center">
          <div
            className="relative overflow-hidden"
            style={{
              height: STAGE_H,
              width: STAGE_H * (tablet.w / tablet.h),
              borderRadius: 18,
              background: '#000',
              padding: 7,
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 12px 34px -12px rgba(0,0,0,0.85)',
            }}
          >
            {/* cámara frontal */}
            <span
              aria-hidden
              className="absolute left-1/2 z-10 -translate-x-1/2 rounded-full"
              style={{ top: 2.5, width: 4, height: 4, background: 'rgba(255,255,255,0.28)' }}
            />
            <div className="relative size-full overflow-hidden" style={{ borderRadius: 11, background: '#0a0b14' }}>
              <Shot
                src={shots.tablet}
                alt={`Render de ${domain} en tablet, viewport ${tablet.viewport}`}
                state={states.tablet}
                onState={set('tablet')}
                className="absolute inset-0 size-full object-cover object-top"
              />
            </div>
          </div>
          <figcaption className="mt-2 flex items-center gap-1.5 font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Tablet className="size-3" aria-hidden /> TABLET · {tablet.viewport}
          </figcaption>
        </figure>
      </div>

      {/* Abrir capturas a tamaño real */}
      <div className="mt-5 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        {DEVICES.map(d => (
          <a
            key={d.key}
            href={shots[d.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[10px] transition-colors hover:text-white"
            style={{ background: '#ffffff08', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            <d.icon className="size-3" aria-hidden />
            {d.label}
            <ExternalLink className="size-2.5" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  )
}
