'use client'

import { Reveal, SectionHeader, TiltCard } from '@/components/cosmos/primitives'
import type { AgentCheck, AgentReadiness, BotVerdict } from '@/lib/scanner/agent-readiness'
import type { AuditResult } from '@/lib/scanner/types'
import { Bot, Check, Info, Minus, X } from 'lucide-react'

const ACCESS_META = {
  allowed:     { label: 'PERMITIDO',  color: 'var(--nova)',   bg: 'oklch(0.86 0.19 155 / 0.12)' },
  blocked:     { label: 'BLOQUEADO',  color: 'var(--pulsar)', bg: 'oklch(0.72 0.2 15 / 0.14)' },
  unspecified: { label: 'NO DECLARADO', color: 'var(--solar)', bg: 'oklch(0.8 0.16 75 / 0.12)' },
} as const

function BotRow({ bot }: { bot: BotVerdict }) {
  const meta = ACCESS_META[bot.access]
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'oklch(1 0 0 / 0.025)', border: '1px solid var(--border)' }}
    >
      <div className="min-w-0">
        <div className="truncate font-mono text-[12px] font-semibold">{bot.name}</div>
        <div className="text-muted-foreground/60 truncate text-[11px]">
          {bot.operator} · {bot.purpose}
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.08em]"
        style={{ background: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>
    </div>
  )
}

function CheckRow({ check }: { check: AgentCheck }) {
  const color =
    check.pass === null ? 'var(--muted-foreground)' : check.pass ? 'var(--nova)' : 'var(--pulsar)'
  const Icon = check.pass === null ? Minus : check.pass ? Check : X

  return (
    <div className="border-t py-4 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"
          style={{ background: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
        >
          <Icon className="size-3" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[14px] font-semibold">{check.label}</h4>
            {check.informative ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                style={{ background: 'oklch(1 0 0 / 0.06)', color: 'var(--muted-foreground)' }}
              >
                <Info aria-hidden className="size-2.5" />
                INFORMATIVA
              </span>
            ) : null}
            {check.pass === null ? (
              <span className="text-muted-foreground/60 font-mono text-[9px] tracking-[0.1em]">
                NO EVALUABLE · EXCLUIDA DEL PUNTAJE
              </span>
            ) : null}
          </div>

          <p className="text-muted-foreground mt-1 text-[13px]">{check.detail}</p>
          <p className="text-muted-foreground/60 mt-1.5 text-[12px]">{check.why}</p>
          <p className="text-muted-foreground/45 mt-1.5 font-mono text-[10px]">{check.source}</p>
        </div>
      </div>
    </div>
  )
}

function ScoreCard({ ar }: { ar: AgentReadiness }) {
  const color = ar.score >= 80 ? 'var(--nova)' : ar.score >= 50 ? 'var(--solar)' : 'var(--pulsar)'
  const glow =
    ar.score >= 80 ? 'oklch(0.86 0.19 155 / 0.35)'
      : ar.score >= 50 ? 'oklch(0.8 0.16 75 / 0.3)'
        : 'oklch(0.72 0.2 15 / 0.4)'

  return (
    <TiltCard glow={glow} className="glass h-full rounded-3xl p-6">
      <span className="text-muted-foreground/70 font-mono text-[10px] tracking-[0.14em] uppercase">
        Agent-Readiness
      </span>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-mono text-[3.2rem] leading-none font-bold tabular-nums" style={{ color }}>
          {ar.score}
        </span>
        <span className="text-muted-foreground/50 mb-1.5 font-mono text-[13px]">/100</span>
      </div>

      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full" style={{ background: 'oklch(1 0 0 / 0.07)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${ar.score}%`, background: color, boxShadow: `0 0 12px 1px ${glow}` }}
        />
      </div>

      <p className="text-muted-foreground/60 mt-4 font-mono text-[11px]">
        {ar.coverage.run} de {ar.coverage.total} chequeos ejecutados
      </p>

      {ar.blockedCount > 0 ? (
        <p className="mt-4 text-[13px]" style={{ color: 'var(--pulsar)' }}>
          {ar.blockedCount} rastreador{ar.blockedCount === 1 ? '' : 'es'} de IA bloqueado
          {ar.blockedCount === 1 ? '' : 's'} en robots.txt.
        </p>
      ) : (
        <p className="text-muted-foreground mt-4 text-[13px]">
          Ningún rastreador de IA está bloqueado.
        </p>
      )}
    </TiltCard>
  )
}

export function AgentReadinessSection({ scanResult }: { scanResult: AuditResult | null }) {
  const ar = scanResult?.agentReadiness ?? null

  return (
    <section id="agentes" className="relative px-5 py-14 sm:px-8 sm:py-18">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeader
            eyebrow="Legibilidad para agentes"
            title={
              <>
                Lo que ve un <span className="text-gradient-cool">agente de IA</span>, no una persona
              </>
            }
            description="Un agente no mira el diseño: lee datos estructurados, comprueba si tiene permiso para rastrear y necesita que los campos de un formulario se identifiquen. Un sitio puede estar impecable para una persona y ser opaco para un agente."
          />
        </Reveal>

        {!ar ? (
          <Reveal delay={80}>
            <div
              className="mt-8 rounded-3xl p-12 text-center"
              style={{ border: '1px dashed var(--border)', background: 'oklch(1 0 0 / 0.02)' }}
            >
              <p className="text-muted-foreground/50 mb-3 font-mono text-[11px] tracking-[0.18em]">
                AGENT-READINESS · SIN DATOS
              </p>
              <p className="text-muted-foreground text-[14px]">
                El análisis aparece aquí tras escanear una URL.
              </p>
            </div>
          </Reveal>
        ) : (
          <>
            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
              <Reveal>
                <ScoreCard ar={ar} />
              </Reveal>

              <Reveal delay={80}>
                <div className="glass h-full rounded-3xl p-6">
                  <div className="flex items-center gap-2">
                    <Bot aria-hidden className="text-muted-foreground/60 size-4" />
                    <h3 className="font-mono text-[11px] tracking-[0.14em] uppercase">
                      Acceso declarado en robots.txt
                    </h3>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {ar.bots.map(b => (
                      <BotRow key={b.name} bot={b} />
                    ))}
                  </div>

                  <p className="text-muted-foreground/55 mt-4 text-[12px]">
                    «No declarado» significa que el archivo no menciona a ese agente: por omisión puede
                    rastrear, pero el sitio no lo decidió de forma explícita.
                  </p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={140}>
              <div className="glass mt-4 rounded-3xl p-6">
                <h3 className="font-mono text-[11px] tracking-[0.14em] uppercase">Chequeos</h3>
                <div className="mt-4">
                  {ar.checks.map(c => (
                    <CheckRow key={c.key} check={c} />
                  ))}
                </div>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  )
}
