'use client'

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useState } from 'react'

// A4 a 96dpi. Se usa como ancho de referencia para que la captura de cada
// sección coincida con las proporciones de la página final del PDF.
const A4_WIDTH_PX = 794
const PDF_WIDTH_MM = 210
const PDF_HEIGHT_MM = 297
/**
 * Altura de una página A4 a la misma escala que A4_WIDTH_PX.
 *
 * El marco de exportación se fija a esta altura para que las unidades `vh` del
 * informe equivalgan a una página. Con el marco a la altura del documento
 * entero, un `minHeight: 90vh` en la portada la estiraba a varias páginas: el
 * PDF salía con 17 en lugar de 10.
 */
const A4_HEIGHT_PX = Math.round((A4_WIDTH_PX * PDF_HEIGHT_MM) / PDF_WIDTH_MM)
/** Fondo del informe. Debe coincidir con RC.void de report-charts. */
const REPORT_BG = '#0A0B14'

async function fetchAsDataUri(absoluteSrc: string): Promise<string> {
  try {
    const res = await fetch(`/api/proxy-image?src=${encodeURIComponent(absoluteSrc)}`)
    if (!res.ok) return absoluteSrc
    const json = await res.json()
    return typeof json.dataUri === 'string' ? json.dataUri : absoluteSrc
  } catch {
    return absoluteSrc
  }
}

/**
 * html2canvas no puede leer píxeles de imágenes de otro origen sin CORS
 * explícito (las capturas de Microlink). Las del mismo origen (logo, assets
 * propios) no tienen ese problema y se dejan tal cual. Se devuelve una
 * función para restaurar el estado original.
 */
async function inlineImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  const originals: Array<[HTMLImageElement, string]> = []

  await Promise.all(imgs.map(async img => {
    const orig = img.getAttribute('src') ?? ''
    if (!orig || orig.startsWith('data:')) return
    const absolute = new URL(orig, window.location.href)
    if (absolute.origin === window.location.origin) return
    originals.push([img, orig])
    img.src = await fetchAsDataUri(absolute.href)
  }))

  await Promise.all(imgs.map(img => img.complete
    ? Promise.resolve()
    : new Promise<void>(resolve => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      })))

  return () => { originals.forEach(([img, orig]) => { img.src = orig }) }
}

interface IsolatedStage {
  /** raíz del informe ya montada dentro del marco aislado */
  root: HTMLElement
  destroy: () => void
}

/**
 * Monta una copia del informe en un marco sin las hojas de estilo de la
 * aplicación.
 *
 * html2canvas clona el documento completo y aborta en cuanto encuentra una
 * función de color que no sabe interpretar. La interfaz usa `oklch()`, que el
 * navegador resuelve a `lab(...)`: había más de 18.000 apariciones fuera del
 * informe, así que la captura fallaba siempre en la primera página y nunca se
 * llegaba a descargar nada.
 *
 * Aislarlo lo resuelve de raíz en lugar de ir parcheando propiedades: el
 * informe declara todos sus colores en línea y en hexadecimal, de modo que sin
 * el CSS de la aplicación se ve igual y no queda ningún color que no se pueda
 * interpretar.
 */
function mountIsolated(source: HTMLElement): IsolatedStage {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${A4_WIDTH_PX}px;height:${A4_HEIGHT_PX}px;border:0;visibility:hidden;`
  document.body.appendChild(frame)

  const doc = frame.contentDocument
  if (!doc) {
    frame.remove()
    throw new Error('No se pudo preparar el documento de exportación')
  }

  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:${REPORT_BG};"></body></html>`)
  doc.close()

  const copy = source.cloneNode(true) as HTMLElement
  // `hidden` viene de la hoja de estilos de la app, que aquí no existe. Se
  // retira la clase para que no quede un atributo huérfano y se fija el ancho
  // de página.
  copy.className = ''
  copy.style.display = 'block'
  copy.style.width = `${A4_WIDTH_PX}px`
  copy.style.maxWidth = `${A4_WIDTH_PX}px`
  doc.body.appendChild(copy)

  return { root: copy, destroy: () => frame.remove() }
}

/**
 * Puntos donde se puede cortar una sección sin partir nada por la mitad.
 *
 * Son los bordes inferiores de sus bloques: tarjetas de hallazgo, filas de
 * tabla, párrafos. Devueltos en coordenadas del lienzo, ya multiplicados por la
 * escala de captura.
 */
function safeBreakOffsets(section: HTMLElement, scale: number): number[] {
  const top = section.getBoundingClientRect().top
  const offsets = new Set<number>()

  // Un nivel de hijos directos, y otro más dentro de tablas y listas, que es
  // donde vive el contenido largo que conviene no cortar a media fila.
  const blocks = Array.from(section.querySelectorAll<HTMLElement>(
    ':scope > *, :scope > * > tbody > tr, :scope > * > * > tbody > tr, :scope > ol > li, :scope > * > ol > li',
  ))

  for (const el of blocks) {
    const rect = el.getBoundingClientRect()
    if (rect.height <= 0) continue
    offsets.add(Math.round((rect.bottom - top) * scale))
  }

  return [...offsets].sort((a, b) => a - b)
}

/**
 * Altura del siguiente corte: la página completa, o el último límite de bloque
 * que quepa dentro de ella. Se exige aprovechar al menos el 55 % de la página
 * para no dejar huecos absurdos cuando un bloque es muy alto.
 */
function sliceHeight(startPx: number, pageHeightPx: number, totalPx: number, breaks: number[]): number {
  const remaining = totalPx - startPx
  if (remaining <= pageHeightPx) return remaining

  const limit = startPx + pageHeightPx
  const minimum = startPx + pageHeightPx * 0.55

  let best = 0
  for (const offset of breaks) {
    if (offset > limit) break
    if (offset > minimum) best = offset
  }

  return best > 0 ? best - startPx : pageHeightPx
}

/**
 * Genera un PDF descargable a partir de las secciones <section> hijas
 * directas de `rootEl`, una captura por sección, cortada en páginas A4.
 * Descarga el archivo directamente — no pasa por el diálogo de impresión.
 */
export async function generateAuditPdf(
  rootEl: HTMLElement,
  filename: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  // Las imágenes se convierten a data URI sobre el original, porque el marco
  // aislado copia el DOM ya resuelto.
  onProgress?.('Preparando imágenes…')
  const restoreImages = await inlineImages(rootEl)

  const stage = mountIsolated(rootEl)
  restoreImages()

  const sections = Array.from(stage.root.querySelectorAll(':scope > section')) as HTMLElement[]
  if (sections.length === 0) {
    stage.destroy()
    throw new Error('No hay contenido para exportar')
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  let firstPage = true

  try {
    for (let i = 0; i < sections.length; i++) {
      onProgress?.(`Generando página ${i + 1} de ${sections.length}…`)
      const canvas = await html2canvas(sections[i], {
        scale: 2,
        useCORS: true,
        // El informe usa la identidad oscura de la aplicación. Con un fondo
        // blanco forzado, cualquier zona sin pintar dejaba franjas claras entre
        // secciones.
        backgroundColor: REPORT_BG,
        windowWidth: A4_WIDTH_PX,
      })

      const pageHeightPx = Math.floor((PDF_HEIGHT_MM * canvas.width) / PDF_WIDTH_MM)
      const scale = canvas.width / sections[i].getBoundingClientRect().width
      const breaks = safeBreakOffsets(sections[i], scale)
      let renderedPx = 0

      while (renderedPx < canvas.height) {
        const sliceHeightPx = sliceHeight(renderedPx, pageHeightPx, canvas.height, breaks)
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = sliceHeightPx
        const ctx = slice.getContext('2d')
        if (!ctx) throw new Error('No se pudo preparar el lienzo de captura')
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

        const sliceHeightMm = (sliceHeightPx * PDF_WIDTH_MM) / canvas.width
        if (!firstPage) pdf.addPage()
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_WIDTH_MM, sliceHeightMm)
        firstPage = false
        renderedPx += sliceHeightPx
      }
    }
  } finally {
    stage.destroy()
  }

  onProgress?.('Descargando…')
  pdf.save(filename)
}

/**
 * Encapsula el flujo común a los tres botones de descarga: mostrar el
 * contenedor oculto del reporte fuera de pantalla, generar el PDF y
 * restaurar el estado. `state` es null en reposo o el texto de progreso.
 */
export function usePdfDownload(domain: string | undefined) {
  const [state, setState] = useState<string | null>(null)

  async function download() {
    const root = document.getElementById('executive-report-root')
    if (!root || !domain) return
    const prevStyle = root.getAttribute('style') ?? ''
    root.style.setProperty('display', 'block', 'important')
    root.style.position = 'fixed'
    root.style.top = '0'
    root.style.left = '-9999px'
    root.style.zIndex = '-1'
    setState('Preparando…')
    try {
      await generateAuditPdf(root, `baral-informe-${domain}-${new Date().toISOString().slice(0, 10)}.pdf`, setState)
    } catch (e) {
      setState(e instanceof Error ? e.message : 'No se pudo generar el PDF')
      setTimeout(() => setState(null), 3000)
      return
    } finally {
      root.setAttribute('style', prevStyle)
    }
    setState(null)
  }

  return { pdfState: state, downloadPdf: download }
}
