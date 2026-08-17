'use client'

import { useEffect, useRef } from 'react'

/**
 * Bottom-anchored planet horizon accent — a thin cropped band from the
 * Baral planet video (bg-baral-horizon.mp4, pre-cropped server-side to
 * exclude the logo wordmark) that grounds the page visually without
 * competing with content. Sits above Starfield, below page content.
 */
export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced && videoRef.current) videoRef.current.pause()
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[34vh] min-h-[220px] max-h-[420px] overflow-hidden">
      <video
        ref={videoRef}
        src="/bg-baral-horizon.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-x-0 bottom-0 h-full w-full object-cover"
        style={{ objectPosition: 'center bottom' }}
      />

      {/* Fade the horizon band into the starfield above it */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(4,2,14,1) 0%, rgba(4,2,14,0.55) 28%, rgba(4,2,14,0.05) 62%, transparent 100%)',
        }}
      />
      {/* Purple ground glow matching the accent color used across the page */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: 'radial-gradient(ellipse 70% 100% at 50% 100%, oklch(0.62 0.24 300 / 0.22), transparent 70%)',
        }}
      />
    </div>
  )
}
