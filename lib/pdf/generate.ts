'use client'

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useState } from 'react'

// A4 a 96dpi. Se usa como ancho de referencia para que la captura de cada
// sección coincida con las proporciones de la página final del PDF.
const A4_WIDTH_PX = 794
const PDF_WIDTH_MM = 210
const PDF_HEIGHT_MM = 297

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
  onProgress?.('Preparando imágenes…')
  const restoreImages = await inlineImages(rootEl)

  const sections = Array.from(rootEl.querySelectorAll(':scope > section')) as HTMLElement[]
  if (sections.length === 0) {
    restoreImages()
    throw new Error('No hay contenido para exportar')
  }

  const prevWidth = rootEl.style.width
  const prevMaxWidth = rootEl.style.maxWidth
  rootEl.style.width = `${A4_WIDTH_PX}px`
  rootEl.style.maxWidth = `${A4_WIDTH_PX}px`

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  let firstPage = true

  try {
    for (let i = 0; i < sections.length; i++) {
      onProgress?.(`Generando página ${i + 1} de ${sections.length}…`)
      const canvas = await html2canvas(sections[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: A4_WIDTH_PX,
      })

      const pageHeightPx = Math.floor((PDF_HEIGHT_MM * canvas.width) / PDF_WIDTH_MM)
      let renderedPx = 0

      while (renderedPx < canvas.height) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)
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
    rootEl.style.width = prevWidth
    rootEl.style.maxWidth = prevMaxWidth
    restoreImages()
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
