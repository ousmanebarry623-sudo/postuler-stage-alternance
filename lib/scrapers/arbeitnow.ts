import { ScraperResult } from './types'

// Arbeitnow — free public API, European jobs, no auth needed
// https://arbeitnow.com/api/job-board-api
export async function scrape(query: string, _location: string): Promise<ScraperResult[]> {
  // Translate common French terms to English for better matching
  const englishQuery = query
    .replace(/électronique/gi, 'electronics')
    .replace(/informatique/gi, 'computer science')
    .replace(/industrielle?/gi, 'industrial')
    .replace(/alternance/gi, 'apprenticeship')
    .replace(/stage/gi, 'internship')
    .replace(/développeur?/gi, 'developer')
    .replace(/ingénieur?/gi, 'engineer')
    .replace(/réseaux?/gi, 'network')
    .replace(/systèmes?/gi, 'systems')
    .replace(/embarqué/gi, 'embedded')

  const params = new URLSearchParams({ search: englishQuery, language: 'en' })
  const url = `https://arbeitnow.com/api/job-board-api?${params}`

  console.log('[arbeitnow] fetching:', url)

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })

    console.log('[arbeitnow] status:', res.status)

    if (!res.ok) {
      console.error('[arbeitnow] HTTP error:', res.status)
      return []
    }

    const data = await res.json()
    const jobs = data.data ?? []
    console.log('[arbeitnow] jobs found:', jobs.length)

    return jobs.slice(0, 20).map((job: {
      title?: string
      company_name?: string
      location?: string
      description?: string
      tags?: string[]
      job_types?: string[]
      url?: string
    }) => ({
      title: job.title ?? '',
      company: job.company_name ?? '',
      location: job.location ?? '',
      description: (job.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 1000),
      skills_required: job.tags ?? [],
      contract_type: job.job_types?.[0] ?? '',
      apply_url: job.url ?? '',
      source: 'arbeitnow',
    })).filter((j: ScraperResult) => j.apply_url && j.title)
  } catch (err) {
    console.error('[arbeitnow] error:', err)
    return []
  }
}
