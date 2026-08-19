'use client'

import { formatCwv } from '@/lib/psi/parse'
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
    <div id="executive-report-root" className="hidden print:block" style={{ color: INK, background: '#ffffff', fontFamily: 'system-ui, -apple-system, Arial, sans-serif' }}>

      {/* ── COVER ── */}
      <section style={{ breakAfter: 'page', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Marca oficial sobre chip oscuro: el arte es claro y sobre papel
                blanco perdería contraste. */}
            <span style={{ background: '#140b26', borderRadius: 10, padding: 5, display: 'inline-flex' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/baral-mark.png" alt="" width={34} height={34} style={{ display: 'block' }} />
            </span>
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

      {/* ── CÓMO LEER ESTE INFORME (lenguaje simple, sin jerga) ── */}
      <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
        <PageHeader domain={r.domain} />
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Cómo leer este informe</h2>
        <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
          Este documento no requiere conocimientos técnicos. A continuación se explica, en términos simples,
          qué significa cada número y cada nivel de urgencia.
        </p>

        <div style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>El puntaje (0 a 100)</h3>
          <p style={{ fontSize: 11.5, color: '#2a2a3d', lineHeight: 1.6, marginBottom: 10 }}>
            Es una nota general de qué tan bien está preparado el sitio para atraer, retener y convertir visitantes
            en clientes. No mide gustos ni diseño: mide condiciones técnicas verificables.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { range: '80–100', label: 'Bueno', color: '#16a34a', desc: 'Base sólida. Quedan mejoras puntuales.' },
              { range: '60–79', label: 'Regular', color: '#ca8a04', desc: 'Funciona, pero pierde oportunidades.' },
              { range: '40–59', label: 'Bajo', color: '#ea580c', desc: 'Problemas que afectan resultados.' },
              { range: '0–39', label: 'Crítico', color: '#dc2626', desc: 'Requiere atención inmediata.' },
            ].map(s => (
              <div key={s.label} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: s.color, margin: 0 }}>{s.range}</p>
                <p style={{ fontSize: 10.5, fontWeight: 700, margin: '2px 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: 9.5, color: MUTED, margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>Los cuatro pilares que se miden</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { k: 'SEO', d: 'Qué tan fácil es que Google encuentre el sitio y lo muestre a personas que buscan lo que la empresa ofrece.' },
              { k: 'Rendimiento', d: 'Qué tan rápido carga el sitio. Cada segundo de espera hace que más visitantes se vayan antes de ver el contenido.' },
              { k: 'Accesibilidad', d: 'Si personas con alguna discapacidad (visual, motriz) pueden usar el sitio sin barreras. También es un requisito legal en muchos países.' },
              { k: 'Conversión', d: 'Qué tan bien está preparado el sitio para convertir una visita en un contacto, una llamada o una venta.' },
            ].map(s => (
              <div key={s.k} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: PURPLE, margin: '0 0 4px' }}>{s.k}</p>
                <p style={{ fontSize: 10.5, color: '#2a2a3d', margin: 0, lineHeight: 1.5 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>Los niveles de urgencia (P0 a P3)</h3>
          <p style={{ fontSize: 11.5, color: '#2a2a3d', lineHeight: 1.6, marginBottom: 10 }}>
            Cada hallazgo trae una etiqueta que indica qué tan urgente es resolverlo. No todo tiene la misma prioridad.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { tag: 'P0', color: '#dc2626', bg: '#fee2e2', d: 'Crítico — hay pérdida activa de tráfico o de clientes en este momento. Se atiende esta semana.' },
              { tag: 'P1', color: '#c2410c', bg: '#ffedd5', d: 'Importante — oportunidad de alto impacto en resultados. Se planifica en el corto plazo.' },
              { tag: 'P2', color: '#a16207', bg: '#fefce8', d: 'Moderado — mejora recomendada, sin urgencia inmediata.' },
              { tag: 'P3', color: MUTED, bg: '#f8f8fb', d: 'Menor — detalle técnico de bajo impacto individual.' },
            ].map(p => (
              <div key={p.tag} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: p.bg, borderRadius: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 800, color: p.color, minWidth: 22 }}>{p.tag}</span>
                <span style={{ fontSize: 10.5, color: '#2a2a3d', lineHeight: 1.4 }}>{p.d}</span>
              </div>
            ))}
          </div>
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
            { label: 'SEO', sub: 'Visibilidad en Google', v: r.scores.seo },
            { label: 'Rendimiento', sub: 'Velocidad de carga', v: r.scores.performance },
            { label: 'Accesibilidad', sub: 'Uso sin barreras', v: r.scores.accessibility },
            { label: 'Conversión', sub: 'Convertir visitas en clientes', v: r.scores.conversion },
          ].map(s => (
            <div key={s.label} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: scoreColor(s.v), margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: MUTED, margin: '4px 0 0', letterSpacing: 0.5 }}>{s.label.toUpperCase()}</p>
              <p style={{ fontSize: 8.5, color: '#9a9ab0', margin: '2px 0 0' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {r.claudeEnrichment?.topPriority && (
          <div style={{ padding: 12, background: '#fef2f2', borderLeft: '3px solid #dc2626', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', margin: '0 0 4px' }}>LO MÁS URGENTE</p>
            <p style={{ fontSize: 12, margin: 0, color: INK }}>{r.claudeEnrichment.topPriority}</p>
          </div>
        )}

        {r.claudeEnrichment?.quickWins && r.claudeEnrichment.quickWins.length > 0 && (
          <div style={{ padding: 12, background: '#fefce8', borderLeft: '3px solid #ca8a04', marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#a16207', margin: '0 0 2px' }}>MEJORAS RÁPIDAS Y DE BAJO COSTO</p>
            <p style={{ fontSize: 9.5, color: '#a16207', margin: '0 0 6px' }}>Se pueden resolver en poco tiempo y ya generan una diferencia visible.</p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11.5, color: INK, lineHeight: 1.7 }}>
              {r.claudeEnrichment.quickWins.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '20px 0 4px' }}>Datos técnicos verificados</h3>
        <p style={{ fontSize: 10.5, color: MUTED, margin: '0 0 10px', lineHeight: 1.5 }}>
          Mediciones directas del sitio en la fecha de esta auditoría, sin interpretación.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 11 }}>
          {[
            ['Respuesta del servidor', `${r.raw.ttfb}ms`], ['Estado del sitio', String(r.raw.statusCode)], ['Palabras en portada', String(r.raw.wordCount)],
            ['Conexión segura (HTTPS)', r.raw.isHttps ? 'Sí' : 'No'], ['Guía para buscadores (robots.txt)', r.raw.robotsTxtExists ? 'Sí' : 'No'], ['Mapa del sitio (sitemap)', r.raw.sitemapExists ? 'Sí' : 'No'],
            ['Títulos principales (H1)', String(r.raw.h1s.length)], ['Total de imágenes', String(r.raw.totalImages)], ['Imágenes sin descripción', String(r.raw.imagesWithoutAlt)],
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
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Oportunidades adicionales</h2>
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            No son urgentes, pero suman: cada una acerca un poco más el sitio a su mejor versión posible.
            La columna &quot;Esfuerzo&quot; indica cuánto trabajo implica resolverla.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BORDER}`, textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Nivel</th>
                <th style={{ padding: '6px 8px' }}>Área</th>
                <th style={{ padding: '6px 8px' }}>Qué se encontró</th>
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

      {/* ── PageSpeed ──
          Antes estas métricas se veían en pantalla y no llegaban al documento
          entregado: el cliente recibía un informe sin sus Core Web Vitals. */}
      {r.psi && (
        <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
          <PageHeader domain={r.domain} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Velocidad medida por Google — PageSpeed Insights</h2>
          <p style={{ fontSize: 11, color: MUTED, margin: '0 0 14px' }}>
            Estrategia móvil, que es la que Google usa para indexar.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
            {([
              ['Rendimiento', r.psi.scores.performance],
              ['Accesibilidad', r.psi.scores.accessibility],
              ['Buenas prácticas', r.psi.scores.bestPractices],
              ['SEO', r.psi.scores.seo],
            ] as [string, number | null][]).map(([k, v]) => (
              <div key={k} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: v === null ? MUTED : scoreColor(v) }}>
                  {v ?? '—'}
                </p>
                <p style={{ fontSize: 9, fontFamily: 'monospace', color: MUTED, margin: '4px 0 0' }}>{k.toUpperCase()}</p>
              </div>
            ))}
          </div>

          {r.psi.field.available ? (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>
                Experiencia de usuarios reales (últimos 28 días)
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 14 }}>
                <tbody>
                  {r.psi.field.metrics.map(m => (
                    <tr key={m.key} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '6px 8px' }}>{m.label}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', textAlign: 'right' }}>{formatCwv(m)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: MUTED, textTransform: 'uppercase', fontSize: 10 }}>
                        {m.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p style={{ fontSize: 11.5, color: MUTED, marginBottom: 14 }}>
              Google no tiene datos de usuarios reales para este sitio: hacen falta 28 días con
              tráfico suficiente. Los puntajes de arriba son de laboratorio, medidos en condiciones
              simuladas.
            </p>
          )}

          {r.psi.opportunities.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px' }}>Dónde se gana más tiempo</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <tbody>
                  {r.psi.opportunities.slice(0, 6).map(o => (
                    <tr key={o.key} style={{ borderTop: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '6px 8px' }}>{o.title}</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>
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

      {/* ── Agent-Readiness ── */}
      {r.agentReadiness && (
      <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
        <PageHeader domain={r.domain} />
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Legibilidad para agentes de IA</h2>
        <p style={{ fontSize: 11, color: MUTED, margin: '0 0 14px' }}>
          Un asistente de IA no ve el diseño: lee datos estructurados y comprueba si tiene permiso
          para rastrear. Este eje mide si el sitio es utilizable por ese canal.
        </p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: scoreColor(r.agentReadiness.score) }}>
            {r.agentReadiness.score}
          </span>
          <span style={{ fontSize: 11, color: MUTED }}>
            de 100 · {r.agentReadiness.coverage.run} de {r.agentReadiness.coverage.total} chequeos ejecutados
          </span>
        </div>

        {r.agentReadiness.blockedCount > 0 && (
          <p style={{ fontSize: 12.5, color: scoreColor(0), fontWeight: 600, marginBottom: 12 }}>
            robots.txt bloquea {r.agentReadiness.blockedCount} rastreador(es) de IA:{' '}
            {r.agentReadiness.bots.filter(b => b.access === 'blocked').map(b => b.name).join(', ')}.
          </p>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <tbody>
            {r.agentReadiness.checks.map(c => (
              <tr key={c.key} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: '6px 8px', width: 26, fontFamily: 'monospace' }}>
                  {c.pass === null ? '—' : c.pass ? '✓' : '✗'}
                </td>
                <td style={{ padding: '6px 8px' }}>
                  <strong>{c.label}</strong>
                  <br />
                  <span style={{ color: MUTED }}>{c.detail}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      )}

      {/* ── Cobertura declarada ── */}
      {r.coverage?.pillars && (
      <section style={{ breakAfter: 'page', padding: '20px 8px' }}>
        <PageHeader domain={r.domain} />
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>Alcance real de esta medición</h2>
        <p style={{ fontSize: 11.5, color: MUTED, margin: '0 0 14px' }}>
          Ningún análisis automático cubre todo. Esta tabla declara de cuántos chequeos posibles se
          sostiene cada puntaje, para que se lean como lo que son: una muestra, no un veredicto.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <tbody>
            {r.coverage.pillars.map(p => (
              <tr key={p.key} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: '8px', verticalAlign: 'top', width: 110 }}>
                  <strong>{p.label}</strong>
                  <br />
                  <span style={{ fontFamily: 'monospace', color: MUTED, fontSize: 10.5 }}>
                    {p.run} de {p.total}
                  </span>
                </td>
                <td style={{ padding: '8px', color: MUTED }}>{p.note}</td>
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
