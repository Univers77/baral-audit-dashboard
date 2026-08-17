'use client'

import type { AuditResult, AuditFinding } from '@/lib/scanner/types'
import type { GA4Metrics } from '@/lib/ga4/types'

const INK = '#1a1a2e'
const MUTED = '#5a5a72'
const PURPLE = '#5B2DBA'
const BORDER = '#e2e2ea'

function scoreColor(n: number) {
  if (n >= 80) return '#16a34a'
  if (n >= 60) return '#ca8a04'
  if (n >= 40) return '#ea580c'
  return '#dc2626'
}
function scoreLabel(n: number) {
  return n >= 80 ? 'Bueno' : n >= 60 ? 'Regular' : n >= 40 ? 'Bajo' : 'Crítico'
}

function FindingBlock({ f }: { f: AuditFinding }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${BORDER}`, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontFamily: 'monospace', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: f.priority === 'P0' ? '#fee2e2' : '#ffedd5',
          color: f.priority === 'P0' ? '#dc2626' : '#c2410c',
        }}>{f.priority}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: MUTED }}>{f.module}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 9, color: MUTED, marginLeft: 'auto' }}>
          Confianza {f.confidence}%
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: INK, margin: '4px 0' }}>{f.title}</p>
      <p style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.5, margin: '4px 0' }}>{f.what}</p>
      <p style={{ fontSize: 11.5, color: '#9a3412', lineHeight: 1.5, margin: '4px 0' }}>
        <strong>Impacto de negocio: </strong>{f.impactBusiness}
      </p>
      {f.direction && (
        <p style={{ fontSize: 11.5, lineHeight: 1.5, margin: '6px 0 0', padding: '8px 10px', background: '#f4f0ff', borderLeft: `3px solid ${PURPLE}`, color: '#3d2a6b' }}>
          <strong>Dirección de solución: </strong>{f.direction}
        </p>
      )}
    </div>
  )
}

function PageHeader({ domain }: { domain: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottom: `2px solid ${PURPLE}` }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: PURPLE, letterSpacing: 1 }}>MASTER WEB AUDITOR</span>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: MUTED }}>{domain}</span>
    </div>
  )
}

export function ExecutiveReport({ scanResult, ga4Data }: { scanResult: AuditResult | null; ga4Data?: GA4Metrics | null }) {
  if (!scanResult) return null
  const r = scanResult
  const score = r.scores?.overall ?? 0
  const dateStr = new Date(r.scanDate).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })
  const p2 = r.compactFindings.filter(f => f.priority === 'P2')
  const p3 = r.compactFindings.filter(f => f.priority === 'P3')

  return (
    <div className="hidden print:block" style={{ color: INK, background: '#ffffff', fontFamily: 'system-ui, -apple-system, Arial, sans-serif' }}>

      {/* ── COVER ── */}
      <section style={{ breakAfter: 'page', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: PURPLE, display: 'grid', placeItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>B</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>BARAL</p>
              <p style={{ fontSize: 8, letterSpacing: 2, color: PURPLE, margin: 0 }}>ESTRATEGIA INTEGRAL CREATIVA</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, color: MUTED, marginBottom: 12 }}>
            INFORME EJECUTIVO DE AUDITORÍA DIGITAL
          </p>
          <h1 style={{ fontSize: 38, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.15 }}>{r.domain}</h1>
          <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{r.url}</p>

          <div style={{ marginTop: 32, display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%', border: `6px solid ${scoreColor(score)}`,
              display: 'grid', placeItems: 'center',
            }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: scoreColor(score) }}>{score}</span>
            </div>
            <p style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: scoreColor(score) }}>{scoreLabel(score)} — Score Global</p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: MUTED }}>Generado el {dateStr}</p>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: MUTED }}>Master Web Auditor v2.0 · GGLabs</p>
        </div>
      </section>

      {/* ── EXECUTIVE SUMMARY + SCORES ── */}
      <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
        <PageHeader domain={r.domain} />
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 14px' }}>Resumen ejecutivo</h2>

        {r.claudeEnrichment?.executiveSummary && (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#2a2a3d', marginBottom: 20 }}>
            {r.claudeEnrichment.executiveSummary}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'SEO', v: r.scores.seo },
            { label: 'Performance', v: r.scores.performance },
            { label: 'Accesibilidad', v: r.scores.accessibility },
            { label: 'Conversión', v: r.scores.conversion },
          ].map(s => (
            <div key={s.label} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: scoreColor(s.v), margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: MUTED, margin: '4px 0 0', letterSpacing: 0.5 }}>{s.label.toUpperCase()}</p>
            </div>
          ))}
        </div>

        {r.claudeEnrichment?.topPriority && (
          <div style={{ padding: 12, background: '#fef2f2', borderLeft: '3px solid #dc2626', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>PRIORIDAD MÁXIMA</p>
            <p style={{ fontSize: 12, margin: 0, color: INK }}>{r.claudeEnrichment.topPriority}</p>
          </div>
        )}

        {r.claudeEnrichment?.quickWins && r.claudeEnrichment.quickWins.length > 0 && (
          <div style={{ padding: 12, background: '#fefce8', borderLeft: '3px solid #ca8a04', marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#a16207', margin: '0 0 6px' }}>QUICK WINS</p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: INK, lineHeight: 1.7 }}>
              {r.claudeEnrichment.quickWins.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '20px 0 10px' }}>Señales técnicas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11 }}>
          {[
            ['TTFB', `${r.raw.ttfb}ms`], ['Status HTTP', String(r.raw.statusCode)], ['Palabras', String(r.raw.wordCount)],
            ['HTTPS', r.raw.isHttps ? 'Sí' : 'No'], ['Robots.txt', r.raw.robotsTxtExists ? 'Sí' : 'No'], ['Sitemap', r.raw.sitemapExists ? 'Sí' : 'No'],
            ['H1 tags', String(r.raw.h1s.length)], ['Imágenes', String(r.raw.totalImages)], ['Sin alt', String(r.raw.imagesWithoutAlt)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#f8f8fb', borderRadius: 4 }}>
              <span style={{ color: MUTED }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {r.tech.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: '20px 0 8px' }}>Stack tecnológico detectado</h3>
            <p style={{ fontSize: 11.5, color: INK, lineHeight: 1.8 }}>
              {r.tech.map(t => t.label).join(' · ')}
            </p>
          </>
        )}
      </section>

      {/* ── EVIDENCIA VISUAL ── */}
      {r.raw.screenshots?.desktop && (
        <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Evidencia visual — render por dispositivo</h2>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Cada captura se tomó con el viewport y el user-agent del dispositivo indicado, activando los
            breakpoints responsive reales del sitio. Sirve como constancia del estado del sitio en la fecha
            de la auditoría.
          </p>

          <div style={{ marginBottom: 14, breakInside: 'avoid' }}>
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: MUTED, marginBottom: 6, letterSpacing: 1 }}>
              ESCRITORIO · 1440 × 900
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.raw.screenshots.desktop}
              alt={`Render de ${r.domain} en escritorio`}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 6, display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 14, breakInside: 'avoid' }}>
            <div style={{ flex: '0 0 30%' }}>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: MUTED, marginBottom: 6, letterSpacing: 1 }}>
                MÓVIL · 390 × 844
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.raw.screenshots.mobile}
                alt={`Render de ${r.domain} en móvil`}
                style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 6, display: 'block' }}
              />
            </div>
            <div style={{ flex: '0 0 45%' }}>
              <p style={{ fontSize: 10, fontFamily: 'monospace', color: MUTED, marginBottom: 6, letterSpacing: 1 }}>
                TABLET · 820 × 1180
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.raw.screenshots.tablet}
                alt={`Render de ${r.domain} en tablet`}
                style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: 6, display: 'block' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ── P0 FINDINGS ── */}
      {r.findings.filter(f => f.priority === 'P0').length > 0 && (
        <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#dc2626' }}>Hallazgos críticos — P0</h2>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 18 }}>Requieren acción esta semana. Pérdida activa de clientes o tráfico.</p>
          {r.findings.filter(f => f.priority === 'P0').map(f => <FindingBlock key={f.id} f={f} />)}
        </section>
      )}

      {/* ── P1 FINDINGS ── */}
      {r.findings.filter(f => f.priority === 'P1').length > 0 && (
        <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#c2410c' }}>Hallazgos importantes — P1</h2>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 18 }}>Oportunidades de alto impacto en conversión y tráfico.</p>
          {r.findings.filter(f => f.priority === 'P1').map(f => <FindingBlock key={f.id} f={f} />)}
        </section>
      )}

      {/* ── COMPACT P2/P3 ── */}
      {(p2.length > 0 || p3.length > 0) && (
        <section style={{ breakAfter: ga4Data ? 'page' : 'auto', padding: '20px 8px' }}>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>Oportunidades adicionales — P2 / P3</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BORDER}`, textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Prioridad</th>
                <th style={{ padding: '6px 8px' }}>Módulo</th>
                <th style={{ padding: '6px 8px' }}>Hallazgo</th>
                <th style={{ padding: '6px 8px' }}>Esfuerzo</th>
              </tr>
            </thead>
            <tbody>
              {[...p2, ...p3].map(f => (
                <tr key={f.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: f.priority === 'P2' ? '#ca8a04' : MUTED }}>{f.priority}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: MUTED }}>{f.module}</td>
                  <td style={{ padding: '6px 8px' }}>{f.title}</td>
                  <td style={{ padding: '6px 8px', color: MUTED }}>{f.effort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── GA4 (si conectado) ── */}
      {ga4Data && (
        <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>Analítica conectada — Google Analytics 4</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              ['Sesiones', ga4Data.sessions.toLocaleString()],
              ['Usuarios', ga4Data.users.toLocaleString()],
              ['Engagement', `${(ga4Data.engagementRate * 100).toFixed(1)}%`],
              ['Conversiones', ga4Data.conversions.toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{v}</p>
                <p style={{ fontSize: 9, fontFamily: 'monospace', color: MUTED, margin: '4px 0 0' }}>{k.toUpperCase()}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: MUTED }}>Rango: {ga4Data.dateRange.startDate} — {ga4Data.dateRange.endDate} · Propiedad GA4: {ga4Data.propertyId}</p>
        </section>
      )}

      {/* ── CLOSING ── */}
      <section style={{ padding: '20px 8px', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>Próximos pasos</h2>
          <ol style={{ fontSize: 12.5, lineHeight: 2, color: INK, paddingLeft: 20 }}>
            <li>Priorizar y asignar responsables a los hallazgos P0 de esta semana.</li>
            <li>Validar cada corrección con el criterio de verificación incluido en cada hallazgo.</li>
            <li>Re-ejecutar el escaneo tras aplicar los cambios para confirmar mejora de score.</li>
            <li>Conectar Google Analytics 4 (si aún no está conectado) para medir impacto real en tráfico y conversión.</li>
          </ol>
        </div>
        <div style={{ textAlign: 'center', paddingTop: 30, borderTop: `1px solid ${BORDER}` }}>
          <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>BARAL — ESTRATEGIA INTEGRAL CREATIVA</p>
          <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Informe generado automáticamente por Master Web Auditor · {dateStr}</p>
        </div>
      </section>
    </div>
  )
}
