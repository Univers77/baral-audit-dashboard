'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'

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
import { UrlScanner } from '@/components/scanner/url-scanner'
import type { Priority } from '@/lib/audit-data'
import type { AuditResult } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'
import { saveHistory } from '@/lib/history'

export default function Page() {
  const [filter, setFilter] = useState<Priority | 'ALL'>('ALL')
  const [focusId, setFocusId] = useState<string | null>(null)
  const [scanResult, setScanResult] = useState<AuditResult | null>(null)
  const [ga4Data, setGa4Data] = useState<GA4Metrics | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('auditorx-last-result')
      if (saved) setScanResult(JSON.parse(saved))
    } catch {}
  }, [])

  const handleResult = useCallback((r: AuditResult) => {
    setScanResult(r)
    setGa4Data(null)
    setFilter('ALL')
    setFocusId(null)
    saveHistory(r, false)
  }, [])

  const handleGA4Data = useCallback((data: GA4Metrics) => {
    setGa4Data(data)
    if (scanResult) saveHistory(scanResult, true)
  }, [scanResult])

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
        <UrlScanner onResult={handleResult} />
        <div
          aria-hidden="true"
          className="pointer-events-none my-2 h-px mx-auto max-w-5xl"
          style={{ background: 'linear-gradient(90deg,transparent,var(--border),transparent)' }}
        />
        <Hero scanResult={scanResult} ga4Data={ga4Data} />
        <ConstellationMap scanResult={scanResult} onFilter={setFilter} onFocusFinding={focusFinding} />
        <FindingsSection scanResult={scanResult} filter={filter} setFilter={setFilter} focusId={focusId} />
        <MetricsSection scanResult={scanResult} />
        <CompetitiveSection />
        <TrajectorySection
          scanResult={scanResult}
          onFocusFinding={focusFinding}
          onGA4Data={handleGA4Data}
          ga4Data={ga4Data}
        />
        <RoadmapSection scanResult={scanResult} onFocusFinding={focusFinding} />
        <FooterSection scanResult={scanResult} ga4Data={ga4Data} />
      </main>
    </div>
  )
}
