'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useState } from 'react'

import { Starfield } from '@/components/cosmos/starfield'
import { SiteNav } from '@/components/audit/site-nav'
import { Hero } from '@/components/audit/hero'
import { ConstellationMap } from '@/components/audit/constellation-map'
import { FindingsSection } from '@/components/audit/findings-section'
import { MetricsSection } from '@/components/audit/metrics-section'
import { CompetitiveSection } from '@/components/audit/competitive-section'
import { TrajectorySection } from '@/components/audit/trajectory-section'
import { RoadmapSection } from '@/components/audit/roadmap-section'
import { FooterSection } from '@/components/audit/footer-section'
import type { Priority } from '@/lib/audit-data'

export default function Page() {
  const [filter, setFilter] = useState<Priority | 'ALL'>('ALL')
  const [focusId, setFocusId] = useState<string | null>(null)

  const focusFinding = useCallback((id: string) => {
    setFilter('ALL')
    setFocusId(id)
    requestAnimationFrame(() => {
      document.getElementById(`finding-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div aria-hidden="true" className="nebula-wash pointer-events-none fixed inset-0 -z-20" />
      <Starfield />

      <SiteNav />

      <main>
        <Hero />
        <ConstellationMap onFilter={setFilter} onFocusFinding={focusFinding} />
        <FindingsSection filter={filter} setFilter={setFilter} focusId={focusId} />
        <MetricsSection />
        <CompetitiveSection />
        <TrajectorySection onFocusFinding={focusFinding} />
        <RoadmapSection onFocusFinding={focusFinding} />
        <FooterSection />
      </main>
    </div>
  )
}
