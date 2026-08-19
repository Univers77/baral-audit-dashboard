/**
 * Jerarquía de encabezados.
 *
 * `h2s` y `h3s` se recolectaban como arrays sueltos, sin orden de documento, lo
 * que impedía validar la estructura. Con `headingOutline` (todos los niveles en
 * el orden en que aparecen) se puede comprobar lo que exige WCAG.
 *
 * Fuente: WCAG 2.2 §1.3.1 (Información y relaciones) y §2.4.6 (Encabezados y
 * etiquetas).
 */

export interface HeadingNode {
  level: number
  text: string
}

export interface HeadingAudit {
  h1Count: number
  total: number
  /** encabezados presentes en el DOM pero sin texto visible */
  emptyCount: number
  /** saltos de nivel: p. ej. un H2 seguido de un H4 */
  skips: { from: number; to: number; text: string }[]
  /** el documento arranca con un nivel distinto de H1 */
  startsBelowH1: boolean
  ok: boolean
}

export function auditHeadings(outline: HeadingNode[]): HeadingAudit {
  const withText = outline.filter(h => h.text.trim().length > 0)
  const emptyCount = outline.length - withText.length
  const h1Count = outline.filter(h => h.level === 1).length

  const skips: { from: number; to: number; text: string }[] = []
  let prev: number | null = null

  for (const h of withText) {
    // Bajar más de un nivel de golpe rompe la navegación por encabezados de un
    // lector de pantalla. Subir de nivel (H4 → H2) es válido: cierra una sección.
    if (prev !== null && h.level > prev + 1) {
      skips.push({ from: prev, to: h.level, text: h.text.slice(0, 80) })
    }
    prev = h.level
  }

  const startsBelowH1 = withText.length > 0 && withText[0].level !== 1

  return {
    h1Count,
    total: outline.length,
    emptyCount,
    skips,
    startsBelowH1,
    ok: skips.length === 0 && emptyCount === 0 && h1Count === 1 && !startsBelowH1,
  }
}
