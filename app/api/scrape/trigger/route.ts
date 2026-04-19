import { NextResponse } from 'next/server'

export const maxDuration = 60

// Public endpoint called from the browser — forwards to the protected /api/scrape/run
export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(`${baseUrl}/api/scrape/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
