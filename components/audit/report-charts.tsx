'use client'

/**
 * Gráficas del informe descargable.
 *
 * Todo en SVG con formas básicas y colores en hexadecimal. Dos restricciones
 * mandan aquí:
 *
 * 1. html2canvas no interpreta `oklch()` ni `color-mix()`, que es lo que usa
 *    la interfaz. Un color así se pierde al generar el PDF, y por eso el
 *    informe vivía en una paleta plana ajena a la aplicación.
 * 2. El SVG se serializa a imagen durante la captura, así que no puede haber
 *    `foreignObject` ni fuentes externas: solo formas y texto con familia
 *    declarada.
 */

// ── Paleta del informe: la identidad de la app, en hexadecimal ──
export const RC = {
  void: '#0A0B14',
  surface: '#12141F',
  surfaceAlt: '#1A1D2E',
  border: '#272B40',
  borderSoft: '#1E2233',
  ink: '#EEF0F8',
  inkSoft: '#C3C8DC',
  muted: '#8A90A8',
  faint: '#5A607A',
  quasar: '#7C3AED',
  quasarLight: '#A78BFA',
  nova: '#22C55E',
  solar: '#EAB308',
  ember: '#F97316',
  pulsar: '#EF4444',
} as const

const SANS = 'Arial, Helvetica, sans-serif'
const MONO = 'Consolas, "Courier New", monospace'

export function scoreColor(n: number): string {
  if (n >= 80) return RC.nova
  if (n >= 60) return RC.solar
  if (n >= 40) return RC.ember
  return RC.pulsar
}

export function scoreLabel(n: number): string {
  return n >= 80 ? 'Bueno' : n >= 60 ? 'Regular' : n >= 40 ? 'Bajo' : 'Crítico'
}

/** Anillo de puntaje. El arco recorre la proporción del score sobre 100. */
export function ScoreDonut({ score, size = 168 }: { score: number; size?: number }) {
  const r = 58
  const c = 2 * Math.PI * r
  const color = scoreColor(score)
  const cx = 70
  const cy = 70

  return (
    <svg width={size} height={size} viewBox="0 0 140 140" role="img" aria-label={`Puntaje global ${score} de 100`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={RC.border} strokeWidth="11" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${(c * score) / 100} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontFamily={SANS} fontSize="40" fontWeight="700" fill={color}>
        {score}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontFamily={MONO} fontSize="10" fill={RC.muted} letterSpacing="1.5">
        DE 100
      </text>
    </svg>
  )
}

/**
 * Barras de los cuatro pilares con una marca en 80, que es el umbral a partir
 * del cual un pilar se considera sano. Sin la referencia, un 62 y un 78 parecen
 * lo mismo.
 */
export function PillarBars({ pillars }: { pillars: { label: string; value: number }[] }) {
  const rowH = 34
  const barX = 118
  const barW = 400
  const h = pillars.length * rowH + 22

  return (
    <svg width="100%" viewBox={`0 0 560 ${h}`} role="img" aria-label="Puntaje por pilar">
      {pillars.map((p, i) => {
        const y = i * rowH + 8
        const color = scoreColor(p.value)
        return (
          <g key={p.label}>
            <text x="0" y={y + 14} fontFamily={SANS} fontSize="12" fontWeight="600" fill={RC.inkSoft}>
              {p.label}
            </text>
            <rect x={barX} y={y + 3} width={barW} height="14" rx="7" fill={RC.surfaceAlt} />
            <rect x={barX} y={y + 3} width={Math.max(4, (barW * p.value) / 100)} height="14" rx="7" fill={color} />
            <text x={barX + barW + 12} y={y + 14} fontFamily={MONO} fontSize="12" fontWeight="700" fill={color}>
              {p.value}
            </text>
          </g>
        )
      })}
      {/* Referencia en 80 */}
      <line
        x1={barX + barW * 0.8} y1="4" x2={barX + barW * 0.8} y2={pillars.length * rowH + 2}
        stroke={RC.faint} strokeWidth="1" strokeDasharray="3 3"
      />
      <text x={barX + barW * 0.8} y={pillars.length * rowH + 16} textAnchor="middle" fontFamily={MONO} fontSize="9" fill={RC.faint}>
        objetivo 80
      </text>
    </svg>
  )
}

/** Reparto de hallazgos por urgencia, en una sola barra proporcional. */
export function PriorityBar({ counts }: { counts: { p0: number; p1: number; p2: number; p3: number } }) {
  const total = counts.p0 + counts.p1 + counts.p2 + counts.p3
  if (total === 0) return null

  const segs = [
    { k: 'P0', n: counts.p0, c: RC.pulsar },
    { k: 'P1', n: counts.p1, c: RC.ember },
    { k: 'P2', n: counts.p2, c: RC.solar },
    { k: 'P3', n: counts.p3, c: RC.faint },
  ].filter(s => s.n > 0)

  const W = 560
  let x = 0

  return (
    <svg width="100%" viewBox="0 0 560 62" role="img" aria-label="Reparto de hallazgos por urgencia">
      {segs.map(s => {
        const w = (W * s.n) / total
        const el = (
          <g key={s.k}>
            <rect x={x} y="0" width={Math.max(2, w - 2)} height="22" rx="4" fill={s.c} />
            {w > 44 && (
              <text x={x + w / 2 - 1} y="15" textAnchor="middle" fontFamily={MONO} fontSize="11" fontWeight="700" fill={RC.void}>
                {s.n}
              </text>
            )}
          </g>
        )
        x += w
        return el
      })}
      {segs.map((s, i) => (
        <g key={`l-${s.k}`}>
          <rect x={i * 96} y="36" width="9" height="9" rx="2" fill={s.c} />
          <text x={i * 96 + 15} y="44" fontFamily={MONO} fontSize="10" fill={RC.muted}>
            {s.k} · {s.n}
          </text>
        </g>
      ))}
    </svg>
  )
}

export interface CwvRow {
  label: string
  display: string
  /** posición relativa 0–1 dentro de la escala de la métrica */
  ratio: number
  verdict: string
}

/**
 * Core Web Vitals sobre una escala con las tres zonas oficiales de Google.
 * El valor se sitúa dentro de la banda, así se ve de un vistazo cuánto falta
 * para pasar al verde en lugar de leer un número sin contexto.
 */
export function CwvBars({ rows }: { rows: CwvRow[] }) {
  const rowH = 40
  const barX = 150
  const barW = 330
  const h = rows.length * rowH + 20

  return (
    <svg width="100%" viewBox={`0 0 560 ${h}`} role="img" aria-label="Core Web Vitals">
      {rows.map((row, i) => {
        const y = i * rowH + 6
        const color = row.verdict === 'bueno' ? RC.nova : row.verdict === 'mejorable' ? RC.solar : RC.pulsar
        const px = barX + Math.min(1, Math.max(0, row.ratio)) * barW
        return (
          <g key={row.label}>
            <text x="0" y={y + 14} fontFamily={SANS} fontSize="11.5" fontWeight="600" fill={RC.inkSoft}>
              {row.label}
            </text>
            {/* Zonas: bueno / mejorable / deficiente */}
            <rect x={barX} y={y + 4} width={barW * 0.45} height="12" fill="#14351F" />
            <rect x={barX + barW * 0.45} y={y + 4} width={barW * 0.25} height="12" fill="#3A2E10" />
            <rect x={barX + barW * 0.7} y={y + 4} width={barW * 0.3} height="12" fill="#3A1A1D" />
            {/* Marcador del valor medido */}
            <rect x={px - 1.5} y={y} width="3" height="20" rx="1.5" fill={color} />
            <text x={barX + barW + 12} y={y + 14} fontFamily={MONO} fontSize="11" fontWeight="700" fill={color}>
              {row.display}
            </text>
          </g>
        )
      })}
      <text x={barX} y={rows.length * rowH + 14} fontFamily={MONO} fontSize="9" fill={RC.faint}>bueno</text>
      <text x={barX + barW * 0.53} y={rows.length * rowH + 14} fontFamily={MONO} fontSize="9" fill={RC.faint}>mejorable</text>
      <text x={barX + barW * 0.82} y={rows.length * rowH + 14} fontFamily={MONO} fontSize="9" fill={RC.faint}>deficiente</text>
    </svg>
  )
}

/** Cobertura declarada: qué proporción de lo evaluable se llegó a comprobar. */
export function CoverageBars({ pillars }: { pillars: { label: string; run: number; total: number }[] }) {
  const rowH = 32
  const barX = 150
  const barW = 320
  const h = pillars.length * rowH + 8

  return (
    <svg width="100%" viewBox={`0 0 560 ${h}`} role="img" aria-label="Cobertura por pilar">
      {pillars.map((p, i) => {
        const y = i * rowH + 6
        const pct = p.total === 0 ? 0 : p.run / p.total
        const color = pct >= 0.6 ? RC.nova : pct >= 0.25 ? RC.solar : RC.pulsar
        return (
          <g key={p.label}>
            <text x="0" y={y + 13} fontFamily={SANS} fontSize="11.5" fontWeight="600" fill={RC.inkSoft}>
              {p.label}
            </text>
            <rect x={barX} y={y + 3} width={barW} height="12" rx="6" fill={RC.surfaceAlt} />
            <rect x={barX} y={y + 3} width={Math.max(3, barW * pct)} height="12" rx="6" fill={color} />
            <text x={barX + barW + 12} y={y + 13} fontFamily={MONO} fontSize="11" fill={RC.muted}>
              {p.run}/{p.total}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Matriz de acceso de rastreadores de IA: una celda por agente. */
export function BotGrid({ bots }: { bots: { name: string; access: string }[] }) {
  const cols = 2
  const colW = 280
  const rowH = 26
  const rows = Math.ceil(bots.length / cols)

  const fill = (a: string) => (a === 'blocked' ? RC.pulsar : a === 'allowed' ? RC.nova : RC.solar)
  const text = (a: string) => (a === 'blocked' ? 'BLOQUEADO' : a === 'allowed' ? 'PERMITIDO' : 'NO DECLARADO')

  return (
    <svg width="100%" viewBox={`0 0 560 ${rows * rowH + 4}`} role="img" aria-label="Acceso de rastreadores de IA">
      {bots.map((b, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = col * colW
        const y = row * rowH
        return (
          <g key={b.name}>
            <circle cx={x + 5} cy={y + 12} r="4" fill={fill(b.access)} />
            <text x={x + 16} y={y + 16} fontFamily={SANS} fontSize="11" fontWeight="600" fill={RC.inkSoft}>
              {b.name}
            </text>
            <text x={x + colW - 22} y={y + 16} textAnchor="end" fontFamily={MONO} fontSize="8.5" fill={fill(b.access)}>
              {text(b.access)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
