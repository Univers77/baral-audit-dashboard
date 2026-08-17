export interface GA4Metrics {
  sessions: number
  users: number
  engagementRate: number
  bounceRate: number
  avgSessionDuration: number
  pageviews: number
  conversions: number
  conversionRate: number
  topPages: { path: string; views: number }[]
  deviceSplit: { device: string; sessions: number; pct: number }[]
  channels: { channel: string; sessions: number; pct: number }[]
  dateRange: { startDate: string; endDate: string }
  propertyId: string
}

export interface GA4ConnectState {
  status: 'disconnected' | 'connecting' | 'fetching' | 'ready' | 'error'
  accessToken?: string
  propertyId?: string
  data?: GA4Metrics
  error?: string
}

export interface ScanHistoryEntry {
  id: string
  url: string
  score: number
  grade: string
  timestamp: number
  findingsCount: number
  ga4Connected: boolean
}
