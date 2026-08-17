import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const IS_VERCEL = process.platform !== 'win32' || !!process.env.VERCEL
const CACHE_DIR = IS_VERCEL ? '/tmp/audit-cache' : 'D:/GGLabs/baral-audit-dashboard/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return NextResponse.json([])
    }
    const files = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'))
    const entries = files.map(f => {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, f), 'utf-8'))
        return {
          domain: raw.domain,
          url: raw.url,
          scanDate: raw.scanDate,
          overall: raw.scores?.overall ?? 0,
        }
      } catch { return null }
    }).filter(Boolean)
    entries.sort((a, b) => new Date(b!.scanDate).getTime() - new Date(a!.scanDate).getTime())
    return NextResponse.json(entries)
  } catch {
    return NextResponse.json([])
  }
}
