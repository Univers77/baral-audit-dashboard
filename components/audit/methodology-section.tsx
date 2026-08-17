'use client'

import { Reveal, SectionHeader } from '@/components/cosmos/primitives'
import { useState } from 'react'

type Framework = {
  id: string
  short: string
  name: string
  source: string
  year: string
  color: string
  what: string
  /** Cómo se traduce en nuestro motor de análisis */
  applied: string[]
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'stanford',
    short: 'Credibilidad',
    name: 'Stanford Web Credibility Guidelines',
    source: 'Stanford Persuasive Technology Lab · B.J. Fogg',
    year: '10 directrices',
    color: 'var(--quasar)',
    what: 'Investigación de la Universidad de Stanford sobre qué hace que una persona confíe —o desconfíe— de un sitio web. Es el marco de referencia sobre credibilidad percibida en la web.',
    applied: [
      'Verificar que exista una organización real y localizable detrás del sitio (NAP consistente)',
      'Facilitar el contacto: teléfono, dirección y formulario sin fricción',
      'Detectar errores de cualquier tipo, «por pequeños que parezcan» — la directriz nº10',
      'Comprobar que el contenido se actualiza y lo demuestra',
      'Evaluar si el diseño transmite profesionalismo acorde al propósito',
    ],
  },
  {
    id: 'nng',
    short: 'Usabilidad',
    name: '10 Heurísticas de Usabilidad',
    source: 'Nielsen Norman Group · Jakob Nielsen',
    year: '1994, vigentes',
    color: 'var(--star)',
    what: 'El estándar de facto para evaluación heurística de interfaces. Son los diez principios contra los que se audita cualquier interfaz sin necesidad de test con usuarios.',
    applied: [
      'Visibilidad del estado del sistema: ¿el usuario sabe qué está pasando?',
      'Consistencia y estándares: mismos patrones en todo el sitio',
      'Prevención de errores en formularios y recorridos de contacto',
      'Diseño estético y minimalista: cada elemento compite por atención',
      'Reconocer antes que recordar: navegación que no exige memoria',
    ],
  },
  {
    id: 'wcag',
    short: 'Accesibilidad',
    name: 'WCAG 2.2 — Nivel AA',
    source: 'W3C · Web Accessibility Initiative',
    year: 'Rec. 2023',
    color: 'var(--nova)',
    what: 'Estándar internacional de accesibilidad web. Nivel AA es el umbral que exige la mayoría de legislaciones y el mínimo defendible para una marca profesional.',
    applied: [
      'Criterio 1.1.1 — Contenido no textual: texto alternativo en imágenes',
      'Criterio 1.4.3 — Contraste mínimo de color 4.5:1',
      'Criterio 3.1.1 — Idioma de la página declarado',
      'Criterio 2.4.6 — Encabezados descriptivos y jerarquía correcta',
      'Criterio 1.4.10 — Reflujo del contenido sin scroll horizontal',
    ],
  },
  {
    id: 'cwv',
    short: 'Rendimiento',
    name: 'Core Web Vitals',
    source: 'Google · web.dev',
    year: 'INP desde 2024',
    color: 'var(--solar)',
    what: 'Las tres métricas que Google usa como señal de ranking para medir experiencia de carga, interactividad y estabilidad visual. Son datos, no opiniones.',
    applied: [
      'LCP — Largest Contentful Paint: cuánto tarda en verse lo principal (objetivo < 2.5s)',
      'INP — Interaction to Next Paint: latencia de respuesta a la interacción (< 200ms)',
      'CLS — Cumulative Layout Shift: estabilidad visual durante la carga (< 0.1)',
      'TTFB — respuesta del servidor como precondición de todo lo anterior (< 800ms)',
    ],
  },
  {
    id: 'eeat',
    short: 'Autoridad',
    name: 'E-E-A-T',
    source: 'Google Search Quality Rater Guidelines',
    year: 'Experiencia añadida 2022',
    color: 'oklch(0.8 0.16 305)',
    what: 'El marco con el que Google evalúa la calidad de un contenido: Experiencia, Pericia, Autoridad y Confiabilidad. Define si un sitio merece posicionar en temas que importan.',
    applied: [
      'Señales de autoría y experiencia demostrable en el contenido',
      'Autoridad del dominio medida por perfil de enlaces entrantes',
      'Confiabilidad: HTTPS, políticas visibles, datos de contacto verificables',
      'Prueba social con resultados verificables, no declaraciones genéricas',
    ],
  },
  {
    id: 'geo',
    short: 'Buscadores IA',
    name: 'GEO — Generative Engine Optimization',
    source: 'Disciplina emergente · llms.txt, Schema.org',
    year: 'Desde 2024',
    color: 'oklch(0.75 0.18 40)',
    what: 'Optimización para que ChatGPT, Perplexity, Claude y AI Overviews puedan leer, entender y citar el sitio. Los LLMs leen mayoritariamente HTML crudo, no la página renderizada.',
    applied: [
      'Porcentaje de contenido renderizado por JavaScript (invisible para muchos crawlers)',
      'Presencia de llms.txt como guía para rastreadores de IA',
      'Schema de identidad (Organization / Person) para declarar la entidad',
      'Crawlers de IA permitidos o bloqueados en robots.txt',
    ],
  },
]

export function MethodologySection() {
  const [active, setActive] = useState<string>('stanford')
  const current = FRAMEWORKS.find(f => f.id === active) ?? FRAMEWORKS[0]

  return (
    <section id="metodologia" className="relative border-t border-border/60 px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Marco metodológico"
            title={
              <>
                No inventamos criterios: <span className="text-gradient-quasar">auditamos contra los estándares</span>
              </>
            }
            description="Cada hallazgo de este informe se evalúa contra un marco público y verificable. Si un punto aparece marcado en rojo, no es una opinión de diseño — es un incumplimiento de un criterio que alguien más ya definió y documentó."
          />
        </Reveal>

        {/* Selector de framework */}
        <Reveal delay={60}>
          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Marcos metodológicos">
            {FRAMEWORKS.map(f => {
              const on = f.id === active
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={on}
                  aria-controls="framework-panel"
                  onClick={() => setActive(f.id)}
                  className="rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.08em] transition-all"
                  style={{
                    background: on ? `color-mix(in oklch, ${f.color} 14%, transparent)` : 'oklch(1 0 0 / 0.03)',
                    border: `1px solid ${on ? f.color : 'var(--border)'}`,
                    color: on ? f.color : 'var(--muted-foreground)',
                    boxShadow: on ? `0 0 18px -6px ${f.color}` : 'none',
                  }}
                >
                  {f.short.toUpperCase()}
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Panel del framework activo */}
        <Reveal delay={110}>
          <div
            id="framework-panel"
            role="tabpanel"
            className="glass mt-5 rounded-3xl p-6 sm:p-8"
            style={{ border: `1px solid ${current.color}33`, boxShadow: `0 0 60px -30px ${current.color}` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: current.color }}>
                  {current.name}
                </h3>
                <p className="mt-1 font-mono text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                  {current.source}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px]"
                style={{ background: `color-mix(in oklch, ${current.color} 12%, transparent)`, color: current.color }}
              >
                {current.year}
              </span>
            </div>

            <p className="mt-4 text-[14px] leading-relaxed text-pretty" style={{ color: 'var(--muted-foreground)' }}>
              {current.what}
            </p>

            <div className="mt-6">
              <p className="mb-3 font-mono text-[10px] tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                CÓMO SE APLICA EN TU ANÁLISIS
              </p>
              <ul className="flex flex-col gap-2.5">
                {current.applied.map(item => (
                  <li key={item} className="flex items-start gap-3 text-[13.5px] leading-relaxed">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full"
                      style={{ background: current.color, boxShadow: `0 0 8px ${current.color}` }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.78)' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Nota de honestidad metodológica */}
        <Reveal delay={150}>
          <p
            className="mt-5 rounded-2xl px-5 py-4 text-[12px] leading-relaxed"
            style={{ background: 'oklch(0.88 0.14 195 / 0.05)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            <strong style={{ color: 'var(--star)' }}>Nota metodológica: </strong>
            el escaneo automatizado lee el HTML que el servidor entrega. No ejecuta JavaScript, por lo que el
            contenido inyectado por el navegador queda fuera del conteo — la misma limitación que tienen la mayoría
            de los rastreadores de buscadores y de LLMs, y por eso es un dato relevante en sí mismo. Los criterios
            que exigen juicio humano (calidad del copy, coherencia de marca, jerarquía visual) se evalúan en las
            sesiones de trabajo, no aquí.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
