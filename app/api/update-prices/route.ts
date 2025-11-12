import { NextResponse } from 'next/server'
import { actualizarPreciosDux } from '../../../lib/updatePrices'

export const runtime = 'nodejs'

function authorized(req: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  const got = req.headers.get('x-cron-key') || new URL(req.url).searchParams.get('key')
  return !!got && got === expected
}

export async function GET(req: Request) {
  if (!authorized(req)) return new NextResponse('Unauthorized', { status: 401 })
  const summary = await actualizarPreciosDux()
  return NextResponse.json(summary)
}

export async function POST(req: Request) {
  if (!authorized(req)) return new NextResponse('Unauthorized', { status: 401 })
  const summary = await actualizarPreciosDux()
  return NextResponse.json(summary)
}
