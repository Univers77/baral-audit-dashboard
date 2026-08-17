import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const QUEUE_FILE = 'D:/GGLabs/audit-queue/pending.json'
const CACHE_DIR  = 'D:/GGLabs/baral-audit-dashboard/cache'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL requerida' }, { status: 400 })
  }

  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
  const timestamp = new Date().toISOString()

  // Read current queue
  let queue: { pending: { id: string; url: string; domain: string; ts: string; status: string }[]; lastUpdated: string | null } = { pending: [], lastUpdated: null }
  try {
    queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'))
  } catch {}

  const id = `audit-${Date.now()}`

  // Add to queue
  queue.pending.push({ id, url, domain, ts: timestamp, status: 'pending' })
  queue.lastUpdated = timestamp
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))

  return NextResponse.json({ id, domain, status: 'queued', message: 'Análisis en cola — Claude Code procesando...' })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    // Return full queue state
    try {
      const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'))
      return NextResponse.json(queue)
    } catch {
      return NextResponse.json({ pending: [], lastUpdated: null })
    }
  }

  // Check if result exists for this domain
  const resultPath = path.join(CACHE_DIR, `${domain}.json`)
  if (fs.existsSync(resultPath)) {
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
    return NextResponse.json({ status: 'ready', data: result })
  }

  return NextResponse.json({ status: 'pending' })
}
