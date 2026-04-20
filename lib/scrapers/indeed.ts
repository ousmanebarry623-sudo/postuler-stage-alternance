import { ScraperResult } from './types'

// Indeed France — RSS feed public (no login needed)
export async function scrape(query: string, location: string): Promise<ScraperResult[]> {
  // Clean location (remove arrondissement number like "09")
  const cleanLocation = location.replace(/\s+\d+$/, '').trim()
  const params = new URLSearchParams({ q: query, l: cleanLocation, sort: 'date', radius: '50' })
  const url = `https://fr.indeed.com/rss?${params}`

  console.log('[indeed] fetching:', url)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })

    console.log('[indeed] status:', res.status, 'content-type:', res.headers.get('content-type'))

    if (!res.ok) {
      console.error('[indeed] HTTP error:', res.status)
      return []
    }

    const xml = await res.text()
    console.log('[indeed] response length:', xml.length, 'preview:', xml.substring(0, 200))

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
    console.log('[indeed] items found:', items.length)

    return items.slice(0, 20).flatMap(item => {
      // Handle both CDATA and plain text
      const get = (tag: string) => {
        const cdata = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim()
        if (cdata) return cdata
        const plain = item.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`))?.[1]?.trim()
        return plain ?? ''
      }

      // link in RSS is often self-closing or between tags
      const getLinkFromItem = (item: string) => {
        // Try guid first (most reliable in Indeed RSS)
        const guid = get('guid')
        if (guid?.startsWith('http')) return guid
        // Try link tag (may appear as <link>url</link> or between other tags)
        const linkMatch = item.match(/<link>([^<]+)<\/link>/) || item.match(/<link\s*\/?>[\s\S]*?<title/)
        if (linkMatch?.[1]) return linkMatch[1].trim()
        return ''
      }

      const title = get('title')
      const link = getLinkFromItem(item)
      const description = get('description').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const company = get('source') || get('author') || ''

      const contractType = /alternance/i.test(title + description) ? 'alternance'
        : /stage/i.test(title + description) ? 'stage'
        : /cdi/i.test(title + description) ? 'cdi'
        : /cdd/i.test(title + description) ? 'cdd' : ''

      if (!title || !link) return []

      return [{
        title,
        company,
        location: cleanLocation,
        description: description.substring(0, 1000),
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
