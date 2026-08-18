import { NextRequest, NextResponse } from 'next/server'

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta/properties'
const GA4_TIMEOUT_MS = 20_000

export async function POST(req: NextRequest) {
  try {
    const { accessToken, propertyId } = await req.json()

    if (!accessToken || !propertyId) {
      return NextResponse.json({ error: 'accessToken y propertyId son requeridos' }, { status: 400 })
    }
    // El propertyId se interpola en la URL: aceptar solo dígitos evita que un
    // valor con `/` o `:` altere la ruta del recurso solicitado.
    if (!/^\d{6,20}$/.test(String(propertyId))) {
      return NextResponse.json(
        { error: 'El ID de propiedad debe ser numérico (por ejemplo, 123456789)' },
        { status: 400 },
      )
    }

    const dateRange = { startDate: '30daysAgo', endDate: 'today' }

    const [mainReport, pagesReport, deviceReport, channelReport] = await Promise.all([
      fetchReport(accessToken, propertyId, {
        dateRanges: [dateRange],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'sessionConversionRate' },
        ],
      }),
      fetchReport(accessToken, propertyId, {
        dateRanges: [dateRange],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      fetchReport(accessToken, propertyId, {
        dateRanges: [dateRange],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      fetchReport(accessToken, propertyId, {
        dateRanges: [dateRange],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
    ])

    const mainRow = mainReport.rows?.[0]?.metricValues ?? []
    const sessions  = parseFloat(mainRow[0]?.value ?? '0')
    const users     = parseFloat(mainRow[1]?.value ?? '0')
    const engagementRate     = parseFloat(mainRow[2]?.value ?? '0')
    const bounceRate         = parseFloat(mainRow[3]?.value ?? '0')
    const avgSessionDuration = parseFloat(mainRow[4]?.value ?? '0')
    const pageviews          = parseFloat(mainRow[5]?.value ?? '0')
    const conversions        = parseFloat(mainRow[6]?.value ?? '0')
    const conversionRate     = parseFloat(mainRow[7]?.value ?? '0')

    const deviceTotal = (deviceReport.rows ?? []).reduce((s: number, r: any) => s + parseFloat(r.metricValues[0].value), 0) || 1
    const channelTotal = (channelReport.rows ?? []).reduce((s: number, r: any) => s + parseFloat(r.metricValues[0].value), 0) || 1

    return NextResponse.json({
      sessions: Math.round(sessions),
      users: Math.round(users),
      engagementRate: Math.round(engagementRate * 100),
      bounceRate: Math.round(bounceRate * 100),
      avgSessionDuration: Math.round(avgSessionDuration),
      pageviews: Math.round(pageviews),
      conversions: Math.round(conversions),
      conversionRate: Math.round(conversionRate * 10000) / 100,
      topPages: (pagesReport.rows ?? []).map((r: any) => ({
        path: r.dimensionValues[0].value,
        views: Math.round(parseFloat(r.metricValues[0].value)),
      })),
      deviceSplit: (deviceReport.rows ?? []).map((r: any) => {
        const s = parseFloat(r.metricValues[0].value)
        return { device: r.dimensionValues[0].value, sessions: Math.round(s), pct: Math.round((s / deviceTotal) * 100) }
      }),
      channels: (channelReport.rows ?? []).map((r: any) => {
        const s = parseFloat(r.metricValues[0].value)
        return { channel: r.dimensionValues[0].value, sessions: Math.round(s), pct: Math.round((s / channelTotal) * 100) }
      }),
      dateRange,
      propertyId,
    })
  } catch (err: unknown) {
    // El detalle crudo se queda en el log; al cliente va un mensaje accionable
    // que nunca incluye el token ni rutas internas.
    console.error('[GA4 route]', err)

    const msg = err instanceof Error ? err.message : ''
    if (/timeout|aborted/i.test(msg)) {
      return NextResponse.json(
        { error: 'Google Analytics tardó demasiado en responder. Vuelva a intentarlo.', code: 'GA4_TIMEOUT' },
        { status: 504 },
      )
    }
    if (/\b401\b|unauthenticated|invalid credentials/i.test(msg)) {
      return NextResponse.json(
        { error: 'La sesión de Google expiró. Vuelva a conectar la cuenta.', code: 'GA4_AUTH' },
        { status: 401 },
      )
    }
    if (/\b403\b|permission/i.test(msg)) {
      return NextResponse.json(
        { error: 'La cuenta conectada no tiene acceso a esa propiedad de Analytics.', code: 'GA4_FORBIDDEN' },
        { status: 403 },
      )
    }
    return NextResponse.json(
      { error: 'No se pudieron obtener los datos de Google Analytics.', code: 'GA4_ERROR' },
      { status: 502 },
    )
  }
}

async function fetchReport(accessToken: string, propertyId: string, body: object) {
  const res = await fetch(`${GA4_API}/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // Sin timeout, una consulta colgada mantenía viva la función hasta el
    // límite de la plataforma y bloqueaba las otras tres en el Promise.all.
    signal: AbortSignal.timeout(GA4_TIMEOUT_MS),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `GA4 error ${res.status}`)
  }
  return res.json()
}
