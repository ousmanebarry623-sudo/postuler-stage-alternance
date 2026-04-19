import { ScraperResult } from './types'

// Adzuna API - free tier (requires ADZUNA_APP_ID + ADZUNA_APP_KEY env vars)
// Register at: https://developer.adzuna.com/
export async function scrape(query: string, location: string): Promise<ScraperResult[]> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    console.warn('[adzuna] Missing ADZUNA_APP_ID or ADZUNA_APP_KEY — skipping')
    return []
  }

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '20',
    what: query,
    where: location,
    content_type: 'application/json',
  })

  const url = `https://api.adzuna.com/v1/api/jobs/fr/search/1?${params}`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    console.error('[adzuna] HTTP error', res.status)
    return []
  }

  const data = await res.json()
  const jobs = data.results ?? []

  return jobs.map((job: {
    title?: string
    company?: { display_name?: string }
    location?: { display_name?: string }
    description?: string
    contract_time?: string
    redirect_url?: string
  }) => ({
    title: job.title ?? '',
    company: job.company?.display_name ?? '',
    location: job.location?.display_name ?? '',
    description: job.description ?? '',
    skills_required: [],
    contract_type: job.contract_time ?? '',
    apply_url: job.redirect_url ?? '',
    source: 'adzuna',
  })).filter((j: ScraperResult) => j.apply_url && j.title)
}
