'use client'

import dynamic from 'next/dynamic'

const SmoothScrollLazy = dynamic(
  () => import('./smooth-scroll').then((m) => ({ default: m.SmoothScroll })),
  { ssr: false },
)

export function SmoothScrollProvider() {
  return <SmoothScrollLazy />
}
