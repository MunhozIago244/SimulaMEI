import { NextResponse } from 'next/server'
import { runOfficeAlertsMonitor } from '@/lib/accountant/office-monitor'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const summary = await runOfficeAlertsMonitor()
  return NextResponse.json({ ok: true, ...summary })
}
