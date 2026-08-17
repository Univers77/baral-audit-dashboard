import type { ScanHistoryEntry } from '@/lib/ga4/types'
import type { AuditResult } from '@/lib/scanner/types'

const KEY = 'auditorx-scan-history'
const MAX = 10

export function saveHistory(result: AuditResult, ga4Connected: boolean): void {
  try {
    const entries: ScanHistoryEntry[] = getHistory()
    const entry: ScanHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: result.url,
      score: result.score ?? 0,
      grade: result.grade ?? 'F',
      timestamp: Date.now(),
      findingsCount: result.findings?.length ?? 0,
      ga4Connected,
    }
    const updated = [entry, ...entries.filter((e) => e.url !== result.url)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {}
}

export function getHistory(): ScanHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
