'use client'

import { CompetitiveInsight } from './competitive-insight'
import type { Subject } from '@/lib/competitive/analysis'
import { formatCwv } from '@/lib/psi/parse'
import {
  BotGrid, CoverageBars, CwvBars, PillarBars, PriorityBar, RC, ScoreDonut,
  scoreColor, scoreLabel, type CwvRow,
} from './report-charts'
import type { AuditResult, AuditFinding } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'

/**
 * Documento descargable. Oculto en pantalla; se captura a PDF sección por
 * sección desde lib/pdf/generate.ts.
 *
 * Usa la identidad visual de la aplicación —fondo oscuro y acento violeta— en
 * hexadecimal, porque html2canvas no interpreta los `oklch()` de la interfaz.
 */

const SANS = 'Arial, Helvetica, sans-serif'
const MONO = 'Consolas, "Courier New", monospace'

const page = {
  breakAfter: 'page' as const,
  padding: '26px 22px',
  background: RC.void,
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 2, color: RC.quasarLight, margin: '0 0 8px' }}>
      {children}
    </p>
  )
}

function H2({ children, color = RC.ink }: { children: React.ReactNode; color?: string }) {
  return <h2 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px', color, letterSpacing: -0.3 }}>{children}</h2>
}

function Dek({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11.5, color: RC.muted, lineHeight: 1.55, margin: '0 0 18px' }}>{children}</p>
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      background: RC.surface,
      border: `1px solid ${RC.border}`,
      borderLeft: accent ? `3px solid ${accent}` : `1px solid ${RC.border}`,
      borderRadius: 6,
      padding: '13px 15px',
    }}>
      {children}
    </div>
  )
}

function FindingBlock({ f }: { f: AuditFinding }) {
  const tone = f.priority === 'P0' ? RC.pulsar : RC.ember
  return (
    <div style={{
      marginBottom: 13, padding: '13px 15px', breakInside: 'avoid',
      background: RC.surface, border: `1px solid ${RC.border}`, borderLeft: `3px solid ${tone}`, borderRadius: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
        <span style={{
          fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
          background: RC.surfaceAlt, color: tone,
        }}>{f.priority}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: RC.faint }}>{f.module}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: RC.faint, marginLeft: 'auto' }}>
          Confianza {f.confidence}%
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: RC.ink, margin: '3px 0' }}>{f.title}</p>
      <p style={{ fontSize: 11.5, color: RC.inkSoft, lineHeight: 1.55, margin: '5px 0' }}>{f.what}</p>
      <p style={{ fontSize: 11.5, color: RC.muted, lineHeight: 1.55, margin: '5px 0' }}>
        <strong style={{ color: tone }}>Impacto de negocio: </strong>{f.impactBusiness}
      </p>
      {f.direction && (
        <p style={{
          fontSize: 11.5, lineHeight: 1.55, margin: '9px 0 0', padding: '9px 11px',
          background: RC.surfaceAlt, borderLeft: `2px solid ${RC.quasar}`, borderRadius: 4, color: RC.inkSoft,
        }}>
          <strong style={{ color: RC.quasarLight }}>Cómo se resuelve: </strong>{f.direction}
        </p>
      )}
    </div>
  )
}

function PageHeader({ domain }: { domain: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 22, paddingBottom: 9, borderBottom: `1px solid ${RC.border}`,
    }}>
      <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: RC.quasarLight, letterSpacing: 1.5 }}>
        MASTER WEB AUDITOR
      </span>
      <span style={{ fontFamily: MONO, fontSize: 9.5, color: RC.faint }}>{domain}</span>
    </div>
  )
}

/**
 * Sitúa un valor dentro de la escala de tres zonas de la gráfica.
 * Las zonas ocupan 45 % / 25 % / 30 % del ancho, así que el reparto no es
 * lineal respecto al valor: se calcula por tramos.
 */
function cwvRatio(value: number, good: number, poor: number): number {
  if (value <= good) return (value / good) * 0.45
  if (value <= poor) return 0.45 + ((value - good) / (poor - good)) * 0.25
  return Math.min(1, 0.7 + ((value - poor) / poor) * 0.3)
}

export function ExecutiveReport({
  scanResult,
  ga4Data,
  rivals = [],
}: {
  scanResult: AuditResult | null
  ga4Data?: GA4Metrics | null
  /** competidores medidos en pantalla; el informe los incorpora si los hay */
  rivals?: Subject[]
}) {
  if (!scanResult) return null
  const r = scanResult
  const score = r.scores?.overall ?? 0
  const dateStr = new Date(r.scanDate).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })
  const p0 = r.findings.filter(f => f.priority === 'P0')
  const p1 = r.findings.filter(f => f.priority === 'P1')
  const p2 = r.compactFindings.filter(f => f.priority === 'P2')
  const p3 = r.compactFindings.filter(f => f.priority === 'P3')

  const cwvRows: CwvRow[] = r.psi?.field.available
    ? r.psi.field.metrics.map(m => ({
        label: m.label,
        display: formatCwv(m),
        ratio: cwvRatio(m.percentile, m.good, m.poor),
        verdict: m.verdict,
      }))
    : []

  return (
    <div
      id="executive-report-root"
      className="hidden print:block"
      style={{ color: RC.ink, background: RC.void, fontFamily: SANS }}
    >

      {/* ── PORTADA ── */}
      <section style={{ ...page, minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/baral-mark.png" alt="" width={36} height={36} style={{ display: 'block' }} />
          <div>
            <p style={{ fontWeight: 800, fontSize: 17, margin: 0, letterSpacing: 3, color: RC.ink }}>BARAL</p>
            <p style={{ fontSize: 7.5, letterSpacing: 2.2, color: RC.quasarLight, margin: '2px 0 0' }}>
              ESTRATEGIA INTEGRAL CREATIVA
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3.5, color: RC.faint, marginBottom: 14 }}>
            RADIOGRAFÍA DIGITAL
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.1, letterSpacing: -1 }}>
            {r.domain}
          </h1>
          <p style={{ fontSize: 12, color: RC.faint, margin: 0, fontFamily: MONO }}>{r.url}</p>

          <div style={{ marginTop: 30, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <ScoreDonut score={score} />
            <p style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: scoreColor(score) }}>
              {scoreLabel(score)}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: MONO, fontSize: 9.5, color: RC.faint, margin: '0 0 3px' }}>Generado el {dateStr}</p>
          <p style={{ fontFamily: MONO, fontSize: 9.5, color: RC.faint, margin: 0 }}>Master Web Auditor v2.0 · GGLabs</p>
        </div>
      </section>

      {/* ── CÓMO LEER ESTE INFORME ── */}
      <section style={page}>
        <PageHeader domain={r.domain} />
        <Eyebrow>ANTES DE EMPEZAR</Eyebrow>
        <H2>Cómo leer este informe</H2>
        <Dek>
          No hace falta saber de tecnología. Aquí se explica, en términos simples, qué significa cada
          número y cada nivel de urgencia.
        </Dek>

        <h3 style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 9px', color: RC.ink }}>El puntaje, de 0 a 100</h3>
        <p style={{ fontSize: 11.5, color: RC.inkSoft, lineHeight: 1.55, margin: '0 0 11px' }}>
          Es una nota general de qué tan preparado está el sitio para atraer visitantes y convertirlos en
          clientes. No mide gustos ni diseño: mide condiciones técnicas verificables.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 22 }}>
          {[
            { range: '80–100', label: 'Bueno', color: RC.nova, desc: 'Base sólida. Quedan mejoras puntuales.' },
            { range: '60–79', label: 'Regular', color: RC.solar, desc: 'Funciona, pero pierde oportunidades.' },
            { range: '40–59', label: 'Bajo', color: RC.ember, desc: 'Problemas que ya afectan resultados.' },
            { range: '0–39', label: 'Crítico', color: RC.pulsar, desc: 'Requiere atención inmediata.' },
          ].map(s => (
            <div key={s.label} style={{ background: RC.surface, border: `1px solid ${RC.border}`, borderRadius: 6, padding: 11 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: s.color, margin: 0, fontFamily: MONO }}>{s.range}</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, margin: '3px 0 4px', color: RC.ink }}>{s.label}</p>
              <p style={{ fontSize: 9.5, color: RC.muted, margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 9px', color: RC.ink }}>Los cuatro pilares</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 22 }}>
          {[
            { k: 'SEO', d: 'Qué tan fácil es que Google encuentre el sitio y lo muestre a quien busca lo que ofreces.' },
            { k: 'Rendimiento', d: 'Qué tan rápido carga. Cada segundo de espera hace que más visitantes se vayan antes de ver nada.' },
            { k: 'Accesibilidad', d: 'Si alguien con una discapacidad visual o motriz puede usar el sitio sin barreras. En muchos países ya es una exigencia legal.' },
            { k: 'Conversión', d: 'Qué tan preparado está el sitio para que una visita termine en un contacto, una llamada o una venta.' },
          ].map(s => (
            <div key={s.k} style={{ background: RC.surface, border: `1px solid ${RC.border}`, borderRadius: 6, padding: 12 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: RC.quasarLight, margin: '0 0 4px' }}>{s.k}</p>
              <p style={{ fontSize: 10.5, color: RC.inkSoft, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 12.5, fontWeight: 700, margin: '0 0 9px', color: RC.ink }}>Los niveles de urgencia</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { tag: 'P0', color: RC.pulsar, d: 'Crítico — hay pérdida activa de clientes o tráfico ahora mismo. Se atiende esta semana.' },
            { tag: 'P1', color: RC.ember, d: 'Importante — alto impacto en resultados. Se planifica en el corto plazo.' },
            { tag: 'P2', color: RC.solar, d: 'Moderado — mejora recomendada, sin urgencia inmediata.' },
            { tag: 'P3', color: RC.faint, d: 'Menor — detalle técnico de bajo impacto individual.' },
          ].map(p => (
            <div key={p.tag} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '8px 11px',
              background: RC.surface, borderRadius: 5, borderLeft: `3px solid ${p.color}`,
            }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: p.color, minWidth: 20 }}>{p.tag}</span>
              <span style={{ fontSize: 10.5, color: RC.inkSoft, lineHeight: 1.45 }}>{p.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESUMEN EJECUTIVO ── */}
      <section style={page}>
        <PageHeader domain={r.domain} />
        <Eyebrow>SÍNTESIS</Eyebrow>
        <H2>Resumen ejecutivo</H2>

        {r.claudeEnrichment?.executiveSummary && (
          <p style={{ fontSize: 13, lineHeight: 1.65, color: RC.inkSoft, margin: '0 0 22px' }}>
            {r.claudeEnrichment.executiveSummary}
          </p>
        )}

        <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px', color: RC.ink }}>Puntaje por pilar</h3>
        <div style={{ marginBottom: 22 }}>
          <PillarBars
            pillars={[
              { label: 'SEO', value: r.scores.seo },
              { label: 'Rendimiento', value: r.scores.performance },
              { label: 'Accesibilidad', value: r.scores.accessibility },
              { label: 'Conversión', value: r.scores.conversion },
            ]}
          />
        </div>

        <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px', color: RC.ink }}>
          Reparto de los {p0.length + p1.length + p2.length + p3.length} hallazgos
        </h3>
        <div style={{ marginBottom: 22 }}>
          <PriorityBar counts={{ p0: p0.length, p1: p1.length, p2: p2.length, p3: p3.length }} />
        </div>

        {r.claudeEnrichment?.topPriority && (
          <div style={{ marginBottom: 11 }}>
            <Card accent={RC.pulsar}>
              <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: RC.pulsar, margin: '0 0 5px', letterSpacing: 1 }}>
                LO MÁS URGENTE
              </p>
              <p style={{ fontSize: 12, margin: 0, color: RC.ink, lineHeight: 1.5 }}>{r.claudeEnrichment.topPriority}</p>
            </Card>
          </div>
        )}

        {r.claudeEnrichment?.quickWins && r.claudeEnrichment.quickWins.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <Card accent={RC.solar}>
              <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: RC.solar, margin: '0 0 3px', letterSpacing: 1 }}>
                MEJORAS RÁPIDAS
              </p>
              <p style={{ fontSize: 9.5, color: RC.muted, margin: '0 0 7px' }}>
                Poco trabajo, diferencia visible.
              </p>
              <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11.5, color: RC.inkSoft, lineHeight: 1.7 }}>
                {r.claudeEnrichment.quickWins.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </Card>
          </div>
        )}

        <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px', color: RC.ink }}>Datos técnicos verificados</h3>
        <p style={{ fontSize: 10.5, color: RC.muted, margin: '0 0 10px', lineHeight: 1.5 }}>
          Mediciones directas del sitio en la fecha de esta auditoría, sin interpretación.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 10.5 }}>
          {[
            ['Respuesta del servidor', `${r.raw.ttfb} ms`], ['Estado del sitio', String(r.raw.statusCode)], ['Palabras en portada', String(r.raw.wordCount)],
            ['Conexión segura', r.raw.isHttps ? 'Sí' : 'No'], ['robots.txt', r.raw.robotsTxtExists ? 'Sí' : 'No'], ['Mapa del sitio', r.raw.sitemapExists ? 'Sí' : 'No'],
            ['Títulos principales (H1)', String(r.raw.h1s.length)], ['Total de imágenes', String(r.raw.totalImages)], ['Imágenes sin descripción', String(r.raw.imagesWithoutAlt)],
          ].map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', gap: 6, padding: '7px 9px',
              background: RC.surface, borderRadius: 4, border: `1px solid ${RC.borderSoft}`,
            }}>
              <span style={{ color: RC.muted }}>{k}</span>
              <span style={{ fontWeight: 700, color: RC.ink, fontFamily: MONO }}>{v}</span>
            </div>
          ))}
        </div>

        {r.tech.length > 0 && (
          <>
            <h3 style={{ fontSize: 12, fontWeight: 700, margin: '20px 0 7px', color: RC.ink }}>Tecnología detectada</h3>
            <p style={{ fontSize: 11, color: RC.inkSoft, lineHeight: 1.7, fontFamily: MONO }}>
              {r.tech.map(t => t.label).join('  ·  ')}
            </p>
          </>
        )}
      </section>

      {/* ── EVIDENCIA VISUAL ── */}
      {r.raw.screenshots?.desktop && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>CONSTANCIA</Eyebrow>
          <H2>Cómo se ve el sitio hoy</H2>
          <Dek>
            Cada captura se tomó con la pantalla y el navegador del dispositivo indicado, activando los
            comportamientos reales del sitio en cada tamaño. Queda como constancia del estado en la fecha
            de esta auditoría.
          </Dek>

          <div style={{ marginBottom: 14, breakInside: 'avoid' }}>
            <p style={{ fontSize: 9.5, fontFamily: MONO, color: RC.faint, marginBottom: 6, letterSpacing: 1 }}>
              ESCRITORIO · 1440 × 900
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.raw.screenshots.desktop}
              alt={`Render de ${r.domain} en escritorio`}
              style={{ width: '100%', border: `1px solid ${RC.border}`, borderRadius: 6, display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 14, breakInside: 'avoid' }}>
            <div style={{ flex: '0 0 30%' }}>
              <p style={{ fontSize: 9.5, fontFamily: MONO, color: RC.faint, marginBottom: 6, letterSpacing: 1 }}>
                MÓVIL · 390 × 844
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.raw.screenshots.mobile}
                alt={`Render de ${r.domain} en móvil`}
                style={{ width: '100%', border: `1px solid ${RC.border}`, borderRadius: 6, display: 'block' }}
              />
            </div>
            <div style={{ flex: '0 0 45%' }}>
              <p style={{ fontSize: 9.5, fontFamily: MONO, color: RC.faint, marginBottom: 6, letterSpacing: 1 }}>
                TABLET · 820 × 1180
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.raw.screenshots.tablet}
                alt={`Render de ${r.domain} en tablet`}
                style={{ width: '100%', border: `1px solid ${RC.border}`, borderRadius: 6, display: 'block' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── HALLAZGOS P0 ── */}
      {p0.length > 0 && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>URGENTE</Eyebrow>
          <H2 color={RC.pulsar}>Hallazgos críticos</H2>
          <Dek>Requieren acción esta semana. Hay pérdida activa de clientes o de tráfico.</Dek>
          {p0.map(f => <FindingBlock key={f.id} f={f} />)}
        </section>
      )}

      {/* ── HALLAZGOS P1 ── */}
      {p1.length > 0 && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>CORTO PLAZO</Eyebrow>
          <H2 color={RC.ember}>Hallazgos importantes</H2>
          <Dek>Oportunidades de alto impacto en tráfico y conversión.</Dek>
          {p1.map(f => <FindingBlock key={f.id} f={f} />)}
        </section>
      )}

      {/* ── P2 / P3 ── */}
      {(p2.length > 0 || p3.length > 0) && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>ACUMULATIVO</Eyebrow>
          <H2>Oportunidades adicionales</H2>
          <Dek>
            No son urgentes, pero suman: cada una acerca un poco más el sitio a su mejor versión. La
            columna de esfuerzo indica cuánto trabajo implica resolverla.
          </Dek>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                {['Nivel', 'Área', 'Qué se encontró', 'Esfuerzo'].map(h => (
                  <th key={h} style={{
                    padding: '7px 9px', fontFamily: MONO, fontSize: 9, letterSpacing: 1,
                    // muted y no faint: la cabecera va sobre el fondo más claro
                    // del documento, donde el gris tenue se queda corto.
                    color: RC.muted, background: RC.surfaceAlt, fontWeight: 700,
                  }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...p2, ...p3].map(f => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${RC.borderSoft}` }}>
                  <td style={{ padding: '7px 9px', fontFamily: MONO, fontWeight: 700, color: f.priority === 'P2' ? RC.solar : RC.faint }}>
                    {f.priority}
                  </td>
                  <td style={{ padding: '7px 9px', fontFamily: MONO, color: RC.faint }}>{f.module}</td>
                  <td style={{ padding: '7px 9px', color: RC.inkSoft }}>{f.title}</td>
                  <td style={{ padding: '7px 9px', color: RC.muted }}>{f.effort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── PAGESPEED ── */}
      {r.psi && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>MEDIDO POR GOOGLE</Eyebrow>
          <H2>Velocidad real</H2>
          <Dek>Estrategia móvil, que es la que Google usa para posicionar.</Dek>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9, marginBottom: 22 }}>
            {([
              ['Rendimiento', r.psi.scores.performance],
              ['Accesibilidad', r.psi.scores.accessibility],
              ['Buenas prácticas', r.psi.scores.bestPractices],
              ['SEO', r.psi.scores.seo],
            ] as [string, number | null][]).map(([k, v]) => (
              <div key={k} style={{
                background: RC.surface, border: `1px solid ${RC.border}`, borderRadius: 6,
                padding: 12, textAlign: 'center',
              }}>
                <p style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: MONO, color: v === null ? RC.faint : scoreColor(v) }}>
                  {v ?? '—'}
                </p>
                <p style={{ fontSize: 8.5, fontFamily: MONO, color: RC.faint, margin: '5px 0 0', letterSpacing: 0.8 }}>
                  {k.toUpperCase()}
                </p>
              </div>
            ))}
          </div>

          {cwvRows.length > 0 ? (
            <>
              <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 4px', color: RC.ink }}>
                Experiencia de usuarios reales
              </h3>
              <p style={{ fontSize: 10.5, color: RC.muted, margin: '0 0 12px' }}>
                Últimos 28 días, según los datos que Google recoge de visitantes reales.
              </p>
              <CwvBars rows={cwvRows} />
            </>
          ) : (
            <Card accent={RC.solar}>
              <p style={{ fontSize: 11.5, color: RC.inkSoft, margin: 0, lineHeight: 1.55 }}>
                Google no tiene datos de usuarios reales para este sitio: hacen falta 28 días con
                tráfico suficiente. Los puntajes de arriba son de laboratorio, medidos en condiciones
                simuladas.
              </p>
            </Card>
          )}

          {r.psi.opportunities.length > 0 && (
            <>
              <h3 style={{ fontSize: 12, fontWeight: 700, margin: '22px 0 9px', color: RC.ink }}>
                Dónde se gana más tiempo
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <tbody>
                  {r.psi.opportunities.slice(0, 6).map(o => (
                    <tr key={o.key} style={{ borderBottom: `1px solid ${RC.borderSoft}` }}>
                      <td style={{ padding: '7px 9px', color: RC.inkSoft }}>{o.title}</td>
                      <td style={{ padding: '7px 9px', fontFamily: MONO, textAlign: 'right', whiteSpace: 'nowrap', color: RC.nova, fontWeight: 700 }}>
                        −{(o.savingsMs / 1000).toFixed(1)} s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      )}

      {/* ── AGENT-READINESS ── */}
      {r.agentReadiness && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>CANAL EMERGENTE</Eyebrow>
          <H2>Qué ve un asistente de IA</H2>
          <Dek>
            Un asistente de IA no mira el diseño: lee datos estructurados y comprueba si tiene permiso
            para entrar. Este eje mide si tu sitio es utilizable por ese canal, que hoy es el que más
            crece.
          </Dek>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 20 }}>
            <ScoreDonut score={r.agentReadiness.score} size={104} />
            <div>
              <p style={{ fontSize: 11.5, color: RC.muted, margin: '0 0 6px' }}>
                {r.agentReadiness.coverage.run} de {r.agentReadiness.coverage.total} chequeos ejecutados
              </p>
              {r.agentReadiness.blockedCount > 0 ? (
                <p style={{ fontSize: 12.5, color: RC.pulsar, fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                  {r.agentReadiness.blockedCount} rastreador{r.agentReadiness.blockedCount === 1 ? '' : 'es'} de IA
                  bloqueado{r.agentReadiness.blockedCount === 1 ? '' : 's'}: tu sitio no puede aparecer citado
                  en esas respuestas.
                </p>
              ) : (
                <p style={{ fontSize: 12.5, color: RC.nova, fontWeight: 700, margin: 0 }}>
                  Ningún rastreador de IA está bloqueado.
                </p>
              )}
            </div>
          </div>

          <h3 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px', color: RC.ink }}>
            Acceso declarado en robots.txt
          </h3>
          <div style={{ marginBottom: 20 }}>
            <BotGrid bots={r.agentReadiness.bots.map(b => ({ name: b.name, access: b.access }))} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {r.agentReadiness.checks.map(c => (
                <tr key={c.key} style={{ borderBottom: `1px solid ${RC.borderSoft}` }}>
                  <td style={{
                    padding: '8px 9px', width: 22, fontFamily: MONO, fontWeight: 700,
                    color: c.pass === null ? RC.faint : c.pass ? RC.nova : RC.pulsar,
                  }}>
                    {c.pass === null ? '—' : c.pass ? '✓' : '✗'}
                  </td>
                  <td style={{ padding: '8px 9px' }}>
                    <strong style={{ color: RC.ink }}>{c.label}</strong>
                    <br />
                    <span style={{ color: RC.muted }}>{c.detail}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── COMPETENCIA ──
          Solo aparece si se midieron competidores en pantalla: el informe
          refleja lo que hay, no deja un apartado vacío. */}
      {rivals.length > 0 && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>POSICIÓN COMPETITIVA</Eyebrow>
          <H2>Frente a quién compites</H2>
          <Dek>
            Cada competidor se midió en vivo con el mismo motor y los mismos criterios, de modo que
            la comparación es pareja y verificable. Lo que sigue no es quién gana cada métrica, sino
            dónde conviene invertir y dónde no.
          </Dek>
          <CompetitiveInsight own={r} rivals={rivals} compact />
        </section>
      )}

      {/* ── COBERTURA ── */}
      {r.coverage?.pillars && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>HONESTIDAD</Eyebrow>
          <H2>Alcance real de esta medición</H2>
          <Dek>
            Ningún análisis automático lo cubre todo. Esto declara de cuántos chequeos posibles se
            sostiene cada puntaje, para que se lean como lo que son: una muestra, no un veredicto.
          </Dek>

          <div style={{ marginBottom: 20 }}>
            <CoverageBars pillars={r.coverage.pillars.map(p => ({ label: p.label, run: p.run, total: p.total }))} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {r.coverage.pillars.map(p => (
              <div key={p.key} style={{ background: RC.surface, border: `1px solid ${RC.borderSoft}`, borderRadius: 5, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: RC.quasarLight, margin: '0 0 3px' }}>
                  {p.label} · <span style={{ fontFamily: MONO, color: RC.muted, fontWeight: 400 }}>{p.run} de {p.total}</span>
                </p>
                <p style={{ fontSize: 10.5, color: RC.muted, margin: 0, lineHeight: 1.5 }}>{p.note}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── GA4 ── */}
      {ga4Data && (
        <section style={page}>
          <PageHeader domain={r.domain} />
          <Eyebrow>COMPORTAMIENTO REAL</Eyebrow>
          <H2>Analítica conectada</H2>
          <Dek>Datos de Google Analytics 4 de los últimos 30 días.</Dek>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9, marginBottom: 16 }}>
            {[
              ['Sesiones', ga4Data.sessions.toLocaleString('es-BO')],
              ['Usuarios', ga4Data.users.toLocaleString('es-BO')],
              ['Engagement', `${(ga4Data.engagementRate * 100).toFixed(1)}%`],
              ['Conversiones', ga4Data.conversions.toLocaleString('es-BO')],
            ].map(([k, v]) => (
              <div key={k} style={{ background: RC.surface, border: `1px solid ${RC.border}`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 19, fontWeight: 800, margin: 0, fontFamily: MONO, color: RC.ink }}>{v}</p>
                <p style={{ fontSize: 8.5, fontFamily: MONO, color: RC.faint, margin: '5px 0 0', letterSpacing: 0.8 }}>{k.toUpperCase()}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: RC.faint, fontFamily: MONO, margin: 0 }}>
            {ga4Data.dateRange.startDate} — {ga4Data.dateRange.endDate} · Propiedad {ga4Data.propertyId}
          </p>
        </section>
      )}

      {/* ── CIERRE ──
          Sin minHeight: con el flujo continuo la sección ocupa lo que necesita
          y el hueco que dejaba antes se aprovecha para lo que venga. */}
      <section style={{ ...page, breakAfter: 'auto' }}>
        <div>
          <PageHeader domain={r.domain} />
          <Eyebrow>A PARTIR DE AQUÍ</Eyebrow>
          <H2>Próximos pasos</H2>
          <ol style={{ fontSize: 12.5, lineHeight: 1.95, color: RC.inkSoft, paddingLeft: 18, margin: '10px 0 0' }}>
            <li>Asignar responsable y fecha a cada hallazgo crítico de esta semana.</li>
            <li>Validar cada corrección con el criterio de verificación que acompaña al hallazgo.</li>
            <li>Volver a medir en 30 días y comparar contra este punto de partida.</li>
            <li>Conectar Search Console y Analytics para pasar de señales del sitio a comportamiento real.</li>
          </ol>

          {r.claudeEnrichment?.strategicNote && (
            <div style={{ marginTop: 20 }}>
              <Card accent={RC.quasar}>
                <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: RC.quasarLight, margin: '0 0 5px', letterSpacing: 1 }}>
                  NOTA ESTRATÉGICA
                </p>
                <p style={{ fontSize: 12, margin: 0, color: RC.inkSoft, lineHeight: 1.55 }}>
                  {r.claudeEnrichment.strategicNote}
                </p>
              </Card>
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${RC.border}`, paddingTop: 14, marginTop: 26 }}>
          <p style={{ fontFamily: MONO, fontSize: 9.5, color: RC.faint, margin: 0 }}>
            BARAL · ESTRATEGIA INTEGRAL CREATIVA
          </p>
          <p style={{ fontFamily: MONO, fontSize: 9.5, color: RC.faint, margin: '3px 0 0' }}>
            {r.domain} · 1 página analizada · {new Date(r.scanDate).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </section>
    </div>
  )
}
