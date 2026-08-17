'use client'

import { useEffect, useRef } from 'react'

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced && videoRef.current) videoRef.current.pause()
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Video base */}
      <video
        ref={videoRef}
        src="/bg-baral.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: 'center center' }}
      />

      {/* Dark veil — keeps text legible over the bright video */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(6, 4, 20, 0.60)' }}
      />

      {/* Purple nebula top — maintains brand identity */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 110% 55% at 50% -5%, oklch(0.62 0.24 300 / 0.22), transparent 55%), ' +
            'radial-gradient(ellipse 80% 50% at 50% 105%, oklch(0.7 0.16 205 / 0.12), transparent 55%)',
        }}
      />

      {/* Vignette edges so content doesn't compete with video corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(4,2,18,0.70) 100%)',
        }}
      />

      {/* Subtle celestial grid — very faint */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, oklch(0.9 0.02 280) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, oklch(0.9 0.02 280) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage:
            'radial-gradient(ellipse 65% 55% at 50% 35%, black, transparent 72%)',
        }}
      />
    </div>
  )
}
