'use client'

import { Reveal, SectionHeader } from '@/components/cosmos/primitives'
import { DeviceRendering } from '@/components/scanner/device-rendering'
import { resolveShots, selectPageShots } from '@/lib/scanner/shots'
import type { AuditResult } from '@/lib/scanner/types'
import { ExternalLink, ImageOff } from 'lucide-react'
import { useMemo, useState } from 'react'

type LoadState = 'loading' | 'ok' | 'error'

function PageCard({ label, path, url, shot }: { label: string; path: string; url: string; shot: string }) {
  const [state, setState] = useState<LoadState>('loading')

  return (
    <figure className="flex flex-col">
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: '16 / 10', background: '#0a0b14', border: '1px solid var(--border)' }}
      >
        {state === 'loading' && (
          <div className="absolute inset-0 grid place-items-center">
            <div
              className="size-5 rounded-full border-2 motion-safe:animate-spin motion-reduce:animate-none"
              style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: '#7C3AED' }}
            />
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 grid place-items-center gap-1">
            <ImageOff className="mx-auto size-4" style={{ color: 'rgba(255,255,255,0.2)' }} aria-hidden />
            <span className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              No se pudo capturar
            </span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shot}
          alt={`Captura de la página ${label} de ${path}`}
          loading="lazy"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className="absolute inset-0 size-full object-cover object-top"
          style={{ opacity: state === 'ok' ? 1 : 0, transition: 'opacity .35s ease' }}
        />
      </div>
      <figcaption className="mt-2 flex items-baseline justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 font-mono text-[9.5px] transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {path} <ExternalLink className="size-2.5" aria-hidden />
        </a>
      </figcaption>
    </figure>
  )
}

export function EvidenceSection({ scanResult }: { scanResult: AuditResult | null }) {
  const shots = useMemo(() => (scanResult ? resolveShots(scanResult.raw) : null), [scanResult])
  const pages = useMemo(() => (scanResult ? selectPageShots(scanResult, 3) : []), [scanResult])

  if (!scanResult || !shots) return null

  const extras = pages.slice(1)

  return (
    <section id="evidencia" className="relative border-t border-border/60 px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Evidencia visual"
            title={
              <>
                Así se ve el sitio <span className="text-gradient-quasar">hoy, de verdad</span>
              </>
            }
            description="Capturas tomadas durante el análisis, con el tamaño de pantalla y el navegador de cada dispositivo. Sirven como constancia fechada del estado del sitio."
          />
        </Reveal>

        <Reveal delay={70}>
          <div className="mt-8">
            <DeviceRendering shots={shots} domain={scanResult.domain} />
          </div>
        </Reveal>

        {/* Páginas internas — variedad real, no la portada repetida */}
        {extras.length > 0 && (
          <Reveal delay={110}>
            <div className="glass mt-5 rounded-2xl p-6" style={{ border: '1px solid var(--border)' }}>
              <p className="font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                OTRAS PÁGINAS DEL SITIO
              </p>
              <p className="mt-1 mb-5 text-[13px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Se priorizan las páginas donde se decide una contratación —servicios, portafolio, contacto— por
                encima de avisos legales o listados de blog.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {extras.map(p => (
                  <PageCard key={p.path} label={p.label} path={p.path} url={p.url} shot={p.shot} />
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {extras.length === 0 && (
          <Reveal delay={110}>
            <p
              className="mt-4 rounded-2xl px-5 py-4 text-[12px] leading-relaxed"
              style={{ background: 'oklch(1 0 0 / 0.02)', border: '1px dashed var(--border)', color: 'var(--muted-foreground)' }}
            >
              No se hallaron páginas internas enlazadas desde la portada. Un sitio sin rutas internas visibles
              limita tanto la navegación del visitante como el recorrido del rastreador de Google.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  )
}
