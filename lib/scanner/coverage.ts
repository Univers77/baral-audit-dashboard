/**
 * Cobertura declarada.
 *
 * El motor restaba puntos por lo que fallaba y trataba en silencio como
 * correcto todo lo que no medía. Un 45 en accesibilidad se presentaba con la
 * misma autoridad que un 45 en rendimiento, aunque el primero se apoyaba en 4
 * chequeos y el segundo en 1.
 *
 * Aquí cada pilar declara de cuántos chequeos posibles se sostiene realmente.
 * No es una métrica de marketing: es la condición para que el puntaje sea
 * interpretable.
 *
 * El caso de accesibilidad está documentado en la literatura: los escáneres
 * automáticos detectan de forma fiable alrededor del 13 % de los criterios
 * WCAG. Ninguna herramienta comercial lo declara en su informe.
 */

import type { RawScan } from './types'
import type { AgentReadiness } from './agent-readiness'

export interface PillarCoverage {
  key: string
  label: string
  /** chequeos que se pudieron ejecutar */
  run: number
  /** chequeos que harían falta para una evaluación completa */
  total: number
  /** qué queda fuera y por qué */
  note: string
}

export interface ScoreCoverage {
  pillars: PillarCoverage[]
  /** porcentaje medio de cobertura, ponderado por total */
  overallPct: number
}

/**
 * Criterios de éxito de WCAG 2.2 en niveles A y AA: 32 + 24.
 * Es el universo real contra el que se mide la accesibilidad.
 */
const WCAG_AA_CRITERIA = 56

export function computeCoverage(raw: RawScan, ar: AgentReadiness): ScoreCoverage {
  // Accesibilidad: solo se cuenta lo que este motor comprueba de verdad.
  const a11yChecks = [
    raw.totalImages > 0,                    // 1.1.1 Contenido no textual
    raw.headingOutline.length > 0,          // 1.3.1 Información y relaciones
    true,                                   // 3.1.1 Idioma de la página
    raw.hasViewportMeta !== undefined,      // 1.4.4 Redimensionar texto (parcial)
    raw.forms.inputCount > 0,               // 3.3.2 Etiquetas o instrucciones
  ].filter(Boolean).length

  const pillars: PillarCoverage[] = [
    {
      key: 'seo',
      label: 'SEO',
      run: [
        raw.title !== undefined,
        raw.metaDescription !== undefined,
        raw.headingOutline.length > 0,
        raw.canonical !== undefined,
        raw.robotsTxtContent !== null,
        raw.sitemapInfo !== null,
        raw.hasSchema !== undefined,
        raw.internalLinks >= 0,
        raw.linkChecks.length > 0,
      ].filter(Boolean).length,
      total: 12,
      note: `Sin acceso a Search Console no se pueden medir posiciones, impresiones ni consultas reales. Se evalúa una sola página, y de sus enlaces se comprobó una muestra de ${raw.linkChecks.length}.`,
    },
    {
      key: 'performance',
      label: 'Rendimiento',
      run: raw.ttfb > 0 ? 1 : 0,
      total: 6,
      note: 'El escaneo propio solo mide el tiempo de respuesta del servidor desde una ubicación. Las Core Web Vitals reales requieren PageSpeed Insights, y los datos de campo requieren tráfico suficiente en CrUX.',
    },
    {
      key: 'accessibility',
      label: 'Accesibilidad',
      run: a11yChecks,
      total: WCAG_AA_CRITERIA,
      note: 'Los escáneres automáticos verifican de forma fiable cerca del 13 % de los criterios WCAG. Contraste de color, orden de foco, navegación por teclado y lectura con lector de pantalla exigen prueba manual.',
    },
    {
      key: 'conversion',
      label: 'Conversión',
      run: [
        raw.hasOpenGraph !== undefined,
        raw.hasTwitterCard !== undefined,
        raw.forms.formCount >= 0,
      ].filter(Boolean).length,
      total: 9,
      note: 'Sin analítica conectada no hay tasa de conversión, embudo real ni puntos de abandono. Lo que se mide son señales de la página, no comportamiento.',
    },
    {
      key: 'agent',
      label: 'Agent-Readiness',
      run: ar.coverage.run,
      total: ar.coverage.total,
      note: 'Todos los chequeos son deterministas sobre el HTML servido. Lo que no se puede saber sin ejecutar una compra real es si el flujo completo termina.',
    },
  ]

  const totalPossible = pillars.reduce((a, p) => a + p.total, 0)
  const totalRun = pillars.reduce((a, p) => a + p.run, 0)

  return {
    pillars,
    overallPct: totalPossible === 0 ? 0 : Math.round((totalRun / totalPossible) * 100),
  }
}
