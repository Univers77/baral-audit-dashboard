import { NextRequest, NextResponse } from 'next/server'

const GA4_API = 'https://analyticsdata.googleapis.com/v1beta/properties'

export async function POST(req: NextRequest) {
  try {
    const { accessToken, propertyId } = await req.json()

    if (!accessToken || !propertyId) {
      return NextResponse.json({ error: 'accessToken y propertyId son requeridos' }, { status: 400 })
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
  } catch (err: any) {
    console.error('[GA4 route]', err)
    return NextResponse.json({ error: err.message ?? 'Error al consultar GA4' }, { status: 500 })
  }
}

async function fetchReport(accessToken: string, propertyId: string, body: object) {
  const res = await fetch(`${GA4_API}/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `GA4 error ${res.status}`)
  }
  return res.json()
}
