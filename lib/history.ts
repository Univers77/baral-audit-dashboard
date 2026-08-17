import type { ScanHistoryEntry } from '@/lib/ga4/types'
import type { AuditResult } from '@/lib/scanner/types'

const KEY = 'auditorx-scan-history'
const MAX = 10

/** AuditResult no expone `grade`; se deriva del score global. */
function gradeFor(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 65) return 'C'
  if (score >= 50) return 'D'
  if (score >= 35) return 'E'
  return 'F'
}

export function saveHistory(result: AuditResult, ga4Connected: boolean): void {
  try {
    const entries: ScanHistoryEntry[] = getHistory()
    const score = result.scores?.overall ?? 0
    const entry: ScanHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: result.url,
      score,
      grade: gradeFor(score),
      timestamp: Date.now(),
      findingsCount: (result.findings?.length ?? 0) + (result.compactFindings?.length ?? 0),
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
