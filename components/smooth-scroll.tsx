'use client'

import { useEffect } from 'react'

export function SmoothScroll() {
  useEffect(() => {
    let cleanup: (() => void) | undefined

    import('lenis').then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.28,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.6,
        infinite: false,
      })

      const raf = (time: number) => {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)

      type W = typeof window & { __lenisInstance?: InstanceType<typeof Lenis> }
      ;(window as W).__lenisInstance = lenis

      cleanup = () => {
        lenis.destroy()
        delete (window as W).__lenisInstance
      }
    })

    return () => cleanup?.()
  }, [])

  return null
}
