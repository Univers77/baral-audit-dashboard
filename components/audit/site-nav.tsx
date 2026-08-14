'use client'

import { site } from '@/lib/audit-data'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const SECTIONS = [
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'hallazgos', label: 'Hallazgos' },
  { id: 'metricas', label: 'Métricas' },
  { id: 'competencia', label: 'Competencia' },
  { id: 'roadmap', label: 'Roadmap' },
]

export function SiteNav() {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('hero')
  const [condensed, setCondensed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
      setCondensed(window.scrollY > 40)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observed = ['hero', ...SECTIONS.map((s) => s.id)]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.05, 0.25, 0.6] },
    )
    observed.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: 'smooth' })
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50">
      <nav
        aria-label="Navegación de la auditoría"
        className={cn(
          'flex items-center justify-between gap-4 px-5 transition-all duration-500 sm:px-8',
          condensed ? 'py-2.5' : 'py-4',
        )}
        style={{
          background: condensed ? 'color-mix(in oklch, var(--void) 78%, transparent)' : 'transparent',
          backdropFilter: condensed ? 'blur(22px) saturate(150%)' : 'none',
          borderBottom: condensed ? '1px solid var(--border)' : '1px solid transparent',
        }}
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex shrink-0 items-center gap-2"
          aria-label="Volver al inicio"
        >
          {/* Baral B mark */}
          <span
            className="grid size-8 place-items-center rounded-lg font-bold text-white text-[15px] shrink-0"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#5B2DBA)', boxShadow: '0 0 18px 4px #7C3AED55' }}
          >
            B
          </span>
          <span className="hidden sm:block font-semibold text-[13px] tracking-widest leading-none">BARAL</span>
        </button>

        <div className="glass hidden items-center gap-1 rounded-full p-1 md:flex" style={{ borderWidth: 1 }}>
          {SECTIONS.map((s) => {
            const isActive = active === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                aria-current={isActive ? 'true' : undefined}
                className={cn(
                  'relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors duration-300',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, oklch(0.88 0.14 310), oklch(0.62 0.24 300))',
                      boxShadow: '0 6px 26px -10px oklch(0.62 0.24 300 / 0.9)',
                    }}
                  />
                )}
                <span className="relative z-10">{s.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-muted-foreground/70 hidden font-mono text-[11px] lg:inline">{site.date}</span>
          <span
            className="text-accent rounded-full px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] whitespace-nowrap"
            style={{
              background: 'oklch(0.88 0.14 195 / 0.08)',
              border: '1px solid oklch(0.88 0.14 195 / 0.28)',
            }}
          >
            NIVEL 0 · {site.level.toUpperCase()}
          </span>
        </div>
      </nav>

      <div className="bg-border/60 h-[2px] w-full">
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundImage: 'linear-gradient(90deg, #FF3D00, #FF9500, #FFB800, #7C3AED)',
            boxShadow: '0 0 14px 1px #7C3AED88',
          }}
        />
      </div>
    </header>
  )
}
