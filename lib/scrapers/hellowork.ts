import { ScraperResult } from './types'

// HelloWork — API interne JSON (no login needed)
export async function scrape(query: string, location: string): Promise<ScraperResult[]> {
  const params = new URLSearchParams({
    k: query,
    l: location,
    ro: '20',
  })
  const url = `https://www.hellowork.com/fr-fr/emploi/recherche.html?${params}`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      console.error('[hellowork] HTTP', res.status)
      return []
    }

    const html = await res.text()

    // Extract JSON-LD job postings
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? []
    const results: ScraperResult[] = []

    for (const block of jsonLdMatches) {
      try {
        const json = JSON.parse(block.replace(/<script[^>]*>/, '').replace(/<\/script>/, ''))
        const jobs = Array.isArray(json) ? json : [json]
        for (const job of jobs) {
          if (job['@type'] !== 'JobPosting') continue
          const title = job.title ?? ''
          const company = job.hiringOrganization?.name ?? ''
          const loc = job.jobLocation?.address?.addressLocality ?? location
          const description = (job.description ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
          const applyUrl = job.url ?? job.mainEntityOfPage ?? ''
          const contractType = job.employmentType ?? ''

          if (!title || !applyUrl) continue
          results.push({ title, company, location: loc, description, skills_required: [], contract_type: contractType, apply_url: applyUrl, source: 'hellowork' })
        }
      } catch { /* skip malformed blocks */ }
    }

    // Fallback: try to extract from __NEXT_DATA__ if JSON-LD is empty
    if (results.length === 0) {
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
      if (nextDataMatch) {
        try {
          const data = JSON.parse(nextDataMatch[1])
          const offers = data?.props?.pageProps?.jobOffers ?? data?.props?.pageProps?.offers ?? []
          for (const offer of offers.slice(0, 20)) {
            const title = offer.label ?? offer.title ?? ''
            const company = offer.company?.name ?? offer.companyName ?? ''
            const loc = offer.location ?? offer.city ?? location
            const applyUrl = offer.url ? `https://www.hellowork.com${offer.url}` : ''
            if (!title || !applyUrl) continue
            results.push({ title, company, location: loc, description: '', skills_required: [], contract_type: offer.contractType ?? '', apply_url: applyUrl, source: 'hellowork' })
          }
        } catch { /* skip */ }
      }
    }

    return results
  } catch (err) {
    console.error('[hellowork] error:', err)
    return []
  }
}
