import { ScraperResult } from './types'

// Indeed France — RSS feed public (no login needed)
export async function scrape(query: string, location: string): Promise<ScraperResult[]> {
  const params = new URLSearchParams({ q: query, l: location, sort: 'date' })
  const url = `https://fr.indeed.com/rss?${params}`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      console.error('[indeed] HTTP', res.status)
      return []
    }

    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    return items.slice(0, 20).flatMap(item => {
      const get = (tag: string) =>
        item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim() ??
        item.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))?.[1]?.trim() ?? ''

      const title = get('title')
      const link = get('guid') || get('link')
      const description = get('description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const company = get('source')

      const contractType = /alternance/i.test(title + description) ? 'alternance'
        : /stage/i.test(title + description) ? 'stage'
        : /cdi/i.test(title + description) ? 'cdi'
        : /cdd/i.test(title + description) ? 'cdd' : ''

      if (!title || !link) return []

      return [{
        title,
        company,
        location,
        description,
        skills_required: [],
        contract_type: contractType,
        apply_url: link,
        source: 'indeed',
      }]
    })
  } catch (err) {
    console.error('[indeed] error:', err)
    return []
  }
}
