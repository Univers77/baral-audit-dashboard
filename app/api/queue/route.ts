import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Endpoint deshabilitado.
 *
 * La implementación anterior mantenía una cola en `D:/GGLabs/audit-queue/pending.json`:
 *
 *  · Ruta absoluta de Windows — inexistente en Vercel, fallaba en producción.
 *  · Ciclo read → parse → push → write sin bloqueo: dos peticiones simultáneas
 *    se pisaban y se perdían trabajos.
 *  · GET sin `domain` devolvía la cola completa, sin autenticación: exponía qué
 *    dominios se estaban auditando y cuándo.
 *
 * No tenía consumidores en la aplicación. Se deja el endpoint respondiendo 501
 * en lugar de eliminarlo para que cualquier cliente externo que aún lo invoque
 * reciba una respuesta explícita en vez de un error de filesystem.
 *
 * Si vuelve a hacer falta una cola, debe apoyarse en almacenamiento durable y
 * compartido (no en el filesystem de la función) y exigir autenticación.
 */
const DISABLED = {
  error: 'Endpoint deshabilitado',
  detail: 'La cola basada en archivos no es compatible con el entorno serverless y fue retirada.',
} as const

export async function GET() {
  return NextResponse.json(DISABLED, { status: 501 })
}

export async function POST() {
  return NextResponse.json(DISABLED, { status: 501 })
}
