'use client'

import { useEffect, useRef, useState } from 'react'
import type { GA4Metrics, GA4ConnectState } from '@/lib/ga4/types'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

declare global {
  interface Window { google: any }
}

interface Props {
  onData: (data: GA4Metrics) => void
}

export function GA4Connect({ onData }: Props) {
  const [state, setState] = useState<GA4ConnectState>({ status: 'disconnected' })
  const [propId, setPropId] = useState('')
  const tokenClient = useRef<any>(null)
  const [gisReady, setGisReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (document.getElementById('gis-script')) {
      if (window.google?.accounts) setGisReady(true)
      return
    }
    const s = document.createElement('script')
    s.id = 'gis-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => setGisReady(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!gisReady || !CLIENT_ID) return
    tokenClient.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp: any) => {
        if (resp.error) {
          setState({ status: 'error', error: `Auth: ${resp.error}` })
          return
        }
        setState((s) => ({ ...s, status: 'connecting', accessToken: resp.access_token }))
      },
    })
  }, [gisReady])

  const handleConnect = () => {
    if (!CLIENT_ID) {
      setState({ status: 'error', error: 'Configura NEXT_PUBLIC_GOOGLE_CLIENT_ID en Vercel para activar esta función.' })
      return
    }
    setState({ status: 'connecting' })
    tokenClient.current?.requestAccessToken({ prompt: '' })
  }

  const handleFetch = async (accessToken: string) => {
    if (!propId.trim()) return
    setState((s) => ({ ...s, status: 'fetching' }))
    try {
      const res = await fetch('/api/ga4/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, propertyId: propId.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`)
      const data: GA4Metrics = json
      setState((s) => ({ ...s, status: 'ready', data, propertyId: propId.trim() }))
      onData(data)
    } catch (e: any) {
      setState((s) => ({ ...s, status: 'error', error: e.message }))
    }
  }

  const handleDisconnect = () => {
    if (state.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(state.accessToken, () => {})
    }
    setState({ status: 'disconnected' })
    setPropId('')
  }

  /* ── Error ── */
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="max-w-sm text-center font-mono text-[11px] text-[var(--pulsar)]">{state.error}</p>
        <button onClick={() => setState({ status: 'disconnected' })} className="font-mono text-[10px] text-muted-foreground underline">
          Volver a intentar
        </button>
      </div>
    )
  }

  /* ── Not connected ── */
  if (state.status === 'disconnected') {
    return (
      <button
        onClick={handleConnect}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-[oklch(0.8_0.16_305/0.3)] bg-[oklch(0.18_0.032_278)] px-7 py-3.5 font-mono text-sm font-medium transition-all hover:border-[oklch(0.8_0.16_305/0.6)] hover:bg-[oklch(0.22_0.04_280)]"
      >
        <GoogleLogo />
        Conectar Google Analytics
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>
    )
  }

  /* ── Connecting (waiting for oauth popup) ── */
  if (state.status === 'connecting' && !state.accessToken) {
    return (
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-[var(--star)]" />
        <span className="font-mono text-xs">Esperando autorización de Google…</span>
      </div>
    )
  }

  /* ── Connected, show property ID input ── */
  if ((state.status === 'connecting') && state.accessToken) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 mx-auto">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--nova)]" />
          <span className="font-mono text-[11px] text-[var(--nova)]">Autorizado · Ingresa el Property ID de GA4</span>
        </div>
        <div className="flex w-full gap-2">
          <input
            type="text"
            value={propId}
            onChange={(e) => setPropId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && state.accessToken && handleFetch(state.accessToken)}
            placeholder="Ej: 123456789"
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-[var(--quasar)]"
          />
          <button
            onClick={() => state.accessToken && handleFetch(state.accessToken)}
            disabled={!propId.trim()}
            className="rounded-xl bg-[var(--quasar)] px-5 py-2.5 font-mono text-[12px] font-bold text-white disabled:opacity-40"
          >
            Analizar
          </button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground/50">
          GA4 → Admin → Configuración de propiedad → Property ID
        </p>
        <button onClick={handleDisconnect} className="font-mono text-[10px] text-muted-foreground/40 underline">
          Cancelar
        </button>
      </div>
    )
  }

  /* ── Fetching ── */
  if (state.status === 'fetching') {
    return (
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-[var(--quasar)]" />
        <span className="font-mono text-xs">Descargando métricas de GA4…</span>
      </div>
    )
  }

  /* ── Ready with data ── */
  if (state.status === 'ready' && state.data) {
    const d = state.data
    const fmt = (n: number) => n.toLocaleString('es-BO')
    const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`

    return (
      <div className="w-full space-y-4">
        {/* Connected badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--nova)]" />
            <span className="font-mono text-[10px] text-[var(--nova)] uppercase tracking-[0.14em]">
              GA4 · Property {d.propertyId} · Últimos 30 días
            </span>
          </div>
          <button onClick={handleDisconnect} className="font-mono text-[10px] text-muted-foreground/50 underline">
            Desconectar
          </button>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Sesiones', value: fmt(d.sessions), sub: '30 días' },
            { label: 'Usuarios', value: fmt(d.users), sub: 'activos' },
            { label: 'Engagement', value: `${d.engagementRate}%`, sub: 'vs rebote' },
            { label: 'Duración media', value: fmtDur(d.avgSessionDuration), sub: 'por sesión' },
          ].map((m) => (
            <div key={m.label} className="glass rounded-2xl p-4 text-center" style={{ border: '1px solid var(--border)' }}>
              <p className="font-mono text-xl font-semibold tabular-nums text-gradient-quasar">{m.value}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{m.label}</p>
              <p className="font-mono text-[9px] text-muted-foreground/50">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Second row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Pageviews', value: fmt(d.pageviews) },
            { label: 'Conversiones', value: fmt(d.conversions) },
            { label: 'Tasa conversión', value: `${d.conversionRate}%` },
          ].map((m) => (
            <div key={m.label} className="glass rounded-2xl p-3 text-center" style={{ border: '1px solid var(--border)' }}>
              <p className="font-mono text-base font-semibold tabular-nums text-[var(--star)]">{m.value}</p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Devices */}
        <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Dispositivos</p>
          <div className="space-y-2">
            {d.deviceSplit.map((dev) => (
              <div key={dev.device} className="flex items-center gap-3">
                <span className="w-20 shrink-0 font-mono text-xs capitalize text-foreground/80">{dev.device}</span>
                <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--quasar)]" style={{ width: `${dev.pct}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{dev.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Canales de tráfico</p>
          <div className="space-y-2">
            {d.channels.map((ch) => (
              <div key={ch.channel} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate font-mono text-xs text-foreground/80">{ch.channel}</span>
                <div className="flex-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--star)]" style={{ width: `${ch.pct}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">{ch.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top pages */}
        <div className="glass rounded-2xl p-5" style={{ border: '1px solid var(--border)' }}>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Páginas más visitadas (30 días)</p>
          <div className="space-y-1.5">
            {d.topPages.map((p, i) => (
              <div key={p.path} className="flex items-center gap-3 py-0.5">
                <span className="w-4 shrink-0 font-mono text-[10px] text-muted-foreground/50">{i + 1}</span>
                <span className="flex-1 truncate font-mono text-xs text-foreground/80">{p.path}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{p.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
