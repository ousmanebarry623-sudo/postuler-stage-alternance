import { ScraperResult } from './types'

// Remotive API - completely free, no auth needed
// Good for remote tech/engineering jobs
export async function scrape(query: string, _location: string): Promise<ScraperResult[]> {
  const params = new URLSearchParams({ search: query, limit: '20' })
  const url = `https://remotive.com/api/remote-jobs?${params}`

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      console.error('[remotive] HTTP error', res.status)
      return []
    }

    const data = await res.json()
    const jobs = data.jobs ?? []

    return jobs.map((job: {
      title?: string
      company_name?: string
      candidate_required_location?: string
      description?: string
      tags?: string[]
      job_type?: string
      url?: string
    }) => ({
      title: job.title ?? '',
      company: job.company_name ?? '',
      location: job.candidate_required_location ?? 'Remote',
      description: job.description ?? '',
      skills_required: job.tags ?? [],
      contract_type: job.job_type ?? '',
      apply_url: job.url ?? '',
      source: 'remotive',
    })).filter((j: ScraperResult) => j.apply_url && j.title)
  } catch (err) {
    console.error('[remotive] fetch error:', err)
    return []
  }
}
