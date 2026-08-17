'use client'

import { Reveal, SectionHeader } from '@/components/cosmos/primitives'
import { classify, PACKAGES, type PackageId } from '@/lib/packages'
import type { AuditResult } from '@/lib/scanner/types'
import { Check, Minus, Cpu, Clock, FileStack } from 'lucide-react'
import { useMemo, useState } from 'react'

const ACCENT: Record<PackageId, string> = {
  radiografia: 'var(--star)',
  resonancia: 'var(--quasar)',
  quirofano: 'var(--nova)',
}

export function PackagesSection({ scanResult }: { scanResult: AuditResult | null }) {
  const [currency, setCurrency] = useState<'USD' | 'BOB'>('USD')
  const cls = useMemo(() => (scanResult ? classify(scanResult) : null), [scanResult])

  return (
    <section id="paquetes" className="relative border-t border-border/60 px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Siguiente paso"
            title={
              <>
                Hasta dónde llevar <span className="text-gradient-quasar">el diagnóstico</span>
              </>
            }
            description="Lo anterior es la radiografía automática: sirve para saber qué está roto, no para arreglarlo. Estos son los tres niveles de acompañamiento, y cuál corresponde según lo que el escaneo encontró en el sitio."
          />
        </Reveal>

        {/* ── Clasificación automática ── */}
        {cls && (
          <Reveal delay={60}>
            <div
              className="glass mt-8 rounded-3xl p-6 sm:p-7"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    CLASIFICACIÓN AUTOMÁTICA · {scanResult?.domain.toUpperCase()}
                  </p>
                  <h3 className="font-display mt-1.5 text-2xl font-semibold tracking-tight">{cls.levelLabel}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-mono text-2xl font-bold tabular-nums text-gradient-quasar">{cls.score}</p>
                    <p className="font-mono text-[9px] tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      ESCALA DIGITAL
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1.5 font-mono text-[10px] font-bold"
                    style={{
                      background:
                        cls.urgency === 'alta' ? 'oklch(0.72 0.2 15 / 0.14)'
                        : cls.urgency === 'media' ? 'oklch(0.85 0.13 88 / 0.14)'
                        : 'oklch(0.86 0.19 155 / 0.14)',
                      color:
                        cls.urgency === 'alta' ? 'var(--pulsar)'
                        : cls.urgency === 'media' ? 'var(--solar)'
                        : 'var(--nova)',
                    }}
                  >
                    URGENCIA {cls.urgency.toUpperCase()}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[13.5px] leading-relaxed text-pretty" style={{ color: 'var(--muted-foreground)' }}>
                {cls.rationale}
              </p>

              {/* Señales medidas */}
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {cls.signals.map(s => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-3.5"
                    style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[9.5px] tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {s.label.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums" style={{ color: 'var(--star)' }}>
                        +{s.points}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] font-semibold">{s.value}</p>
                    <p className="mt-1 text-[11.5px] leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {s.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Selector de moneda ── */}
        <Reveal delay={90}>
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {(['USD', 'BOB'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className="rounded-full px-4 py-1.5 font-mono text-[11px] transition-all"
                style={{
                  background: currency === c ? 'oklch(0.8 0.16 305 / 0.14)' : 'transparent',
                  border: `1px solid ${currency === c ? 'var(--quasar)' : 'var(--border)'}`,
                  color: currency === c ? 'var(--quasar)' : 'var(--muted-foreground)',
                }}
              >
                {c === 'USD' ? 'USD $' : 'BOB Bs'}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ── Paquetes ── */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {PACKAGES.map((p, i) => {
            const isRec = cls?.recommended === p.id
            const accent = ACCENT[p.id]
            return (
              <Reveal key={p.id} delay={120 + i * 80}>
                <div
                  className="relative flex h-full flex-col rounded-3xl p-6"
                  style={{
                    background: isRec
                      ? 'linear-gradient(160deg, oklch(0.2 0.05 290) 0%, oklch(0.15 0.03 280) 100%)'
                      : 'oklch(1 0 0 / 0.025)',
                    border: `1px solid ${isRec ? accent : 'var(--border)'}`,
                    boxShadow: isRec ? `0 0 70px -25px ${accent}` : 'none',
                  }}
                >
                  {isRec && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 font-mono text-[9px] font-bold tracking-[0.14em] whitespace-nowrap"
                      style={{ background: accent, color: '#0a0b14' }}
                    >
                      RECOMENDADO PARA USTED
                    </span>
                  )}

                  <h3 className="font-display text-2xl font-semibold tracking-tight" style={{ color: accent }}>
                    {p.name}
                  </h3>
                  <p className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                    {p.tagline}
                  </p>

                  {/* Precio */}
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-mono text-[15px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {currency === 'USD' ? '$' : 'Bs'}
                    </span>
                    <span className="font-display text-4xl font-bold tabular-nums">
                      {(currency === 'USD' ? p.priceUSD : p.priceBOB).toLocaleString('es-BO')}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    proyecto único · sin suscripción
                  </p>

                  {/* Meta */}
                  <div className="mt-4 flex flex-col gap-2 border-y py-3.5" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 text-[12px]">
                      <Clock className="size-3.5 shrink-0" style={{ color: accent }} aria-hidden />
                      <span style={{ color: 'var(--muted-foreground)' }}>{p.delivery}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]">
                      <FileStack className="size-3.5 shrink-0" style={{ color: accent }} aria-hidden />
                      <span style={{ color: 'var(--muted-foreground)' }}>{p.pagesAnalyzed}</span>
                    </div>
                    <div className="flex items-start gap-2 text-[12px]">
                      <Cpu className="mt-0.5 size-3.5 shrink-0" style={{ color: accent }} aria-hidden />
                      <span style={{ color: 'var(--muted-foreground)' }}>
                        Motor: <strong style={{ color: accent }}>{p.model.name}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 font-mono text-[10.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {p.bestFor}
                  </p>

                  {/* Incluye */}
                  <ul className="mt-4 flex flex-1 flex-col gap-2">
                    {p.includes.map(inc => (
                      <li key={inc} className="flex items-start gap-2 text-[12.5px] leading-snug">
                        <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: accent }} aria-hidden />
                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>{inc}</span>
                      </li>
                    ))}
                    {p.excludes?.map(exc => (
                      <li key={exc} className="flex items-start gap-2 text-[12.5px] leading-snug">
                        <Minus className="mt-0.5 size-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }} aria-hidden />
                        <span style={{ color: 'rgba(255,255,255,0.32)' }}>{exc}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Por qué este modelo */}
                  <div
                    className="mt-4 rounded-xl p-3"
                    style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--border)' }}
                  >
                    <p className="font-mono text-[9px] tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                      POR QUÉ ESTE MODELO
                    </p>
                    <p className="mt-1 text-[11.5px] leading-snug" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {p.model.why}
                    </p>
                  </div>

                  <a
                    href={`mailto:contacto@baralintegral.com?subject=${encodeURIComponent(`Paquete ${p.name} — ${scanResult?.domain ?? 'consulta'}`)}`}
                    className="mt-5 block rounded-2xl py-3 text-center font-mono text-[12px] font-bold tracking-wide transition-opacity hover:opacity-90"
                    style={{
                      background: isRec ? accent : 'oklch(1 0 0 / 0.05)',
                      color: isRec ? '#0a0b14' : 'rgba(255,255,255,0.85)',
                      border: `1px solid ${isRec ? accent : 'var(--border)'}`,
                    }}
                  >
                    Agendar {p.name}
                  </a>
                </div>
              </Reveal>
            )
          })}
        </div>

        {/* ── Transparencia del motor de IA ── */}
        <Reveal delay={200}>
          <div
            className="mt-8 rounded-3xl p-6 sm:p-7"
            style={{ background: 'oklch(0.88 0.14 195 / 0.04)', border: '1px solid oklch(0.88 0.14 195 / 0.22)' }}
          >
            <div className="flex items-center gap-2">
              <Cpu className="size-4" style={{ color: 'var(--star)' }} aria-hidden />
              <p className="font-mono text-[11px] tracking-[0.16em]" style={{ color: 'var(--star)' }}>
                TRANSPARENCIA DEL MOTOR DE ANÁLISIS
              </p>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-pretty" style={{ color: 'var(--muted-foreground)' }}>
              El escaneo técnico es determinista: mide el HTML, los tiempos de respuesta y los recursos del sitio.
              Sobre esa evidencia trabaja un modelo de lenguaje de Anthropic —<strong style={{ color: 'var(--star)' }}> Claude</strong>—
              que interpreta los hallazgos, detecta causas raíz compartidas entre módulos y redacta la lectura
              estratégica. El modelo <em>no inventa métricas</em>: solo razona sobre los datos que el escáner ya midió.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              La diferencia entre paquetes no es cosmética. Un modelo más capaz sostiene cadenas de razonamiento más
              largas: puede cruzar veinticinco páginas y notar que el problema de conversión y el de arquitectura
              tienen la misma causa. Por eso el nivel de modelo escala con la complejidad del sitio, y por eso el
              precio también.
            </p>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {PACKAGES.map(p => (
                <div
                  key={p.id}
                  className="rounded-2xl p-3.5"
                  style={{ background: 'oklch(1 0 0 / 0.03)', border: '1px solid var(--border)' }}
                >
                  <p className="font-mono text-[10px]" style={{ color: ACCENT[p.id] }}>
                    {p.name.toUpperCase()}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold">{p.model.name}</p>
                  <p className="mt-0.5 font-mono text-[9.5px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {p.model.id}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 font-mono text-[10.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              El juicio final siempre es humano. La IA acelera el análisis y amplía la cobertura; las decisiones de
              negocio, la jerarquía de marca y la estrategia las define el equipo de Baral en las sesiones de trabajo.
            </p>
          </div>
        </Reveal>

        {/* ── Contexto de mercado ── */}
        <Reveal delay={240}>
          <div className="mt-6 overflow-hidden rounded-3xl" style={{ border: '1px solid var(--border)' }}>
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)', background: 'oklch(1 0 0 / 0.02)' }}>
              <p className="font-mono text-[10.5px] tracking-[0.14em]" style={{ color: 'var(--muted-foreground)' }}>
                DÓNDE NOS UBICAMOS
              </p>
            </div>
            <div className="grid gap-px sm:grid-cols-3" style={{ background: 'var(--border)' }}>
              {[
                {
                  t: 'Herramienta automática',
                  p: 'Desde $0',
                  d: 'Un informe generado por software. Indica qué está mal, en inglés y sin contexto del negocio. Nadie interpreta el resultado ni establece prioridades.',
                  tone: 'rgba(255,255,255,0.35)',
                },
                {
                  t: 'Baral · Radiografía a Quirófano',
                  p: '$290 – $2.400',
                  d: 'Escaneo determinista + interpretación con Claude + criterio del equipo. Priorizado por impacto de negocio, en español y con acompañamiento hasta la ejecución.',
                  tone: 'var(--quasar)',
                },
                {
                  t: 'Consultora internacional',
                  p: '$5.000+',
                  d: 'Profundidad equivalente o mayor, con plazos de semanas, contratos anuales y sin conocimiento del mercado boliviano ni de tu sector local.',
                  tone: 'rgba(255,255,255,0.35)',
                },
              ].map(c => (
                <div key={c.t} className="p-5" style={{ background: '#0a0b14' }}>
                  <p className="font-mono text-[10px] tracking-[0.1em]" style={{ color: c.tone }}>
                    {c.t.toUpperCase()}
                  </p>
                  <p className="mt-2 font-display text-xl font-bold" style={{ color: c.tone }}>
                    {c.p}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {c.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Rangos de referencia para ubicar la propuesta, no una comparación de precios verificada uno a uno.
            Cada proyecto se cotiza según alcance real tras la sesión de diagnóstico.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
