import { ScraperResult } from './types'
import { scrape as scrapeAdzuna } from './adzuna'
import { scrape as scrapeFranceTravail } from './francetravail'
import { scrape as scrapeRemotive } from './remotive'
import { scrape as scrapeIndeed } from './indeed'
import { scrape as scrapeHelloWork } from './hellowork'
import { scrape as scrapeArbeitnow } from './arbeitnow'

export async function runAllScrapers(query: string, location: string): Promise<ScraperResult[]> {
  const scrapers = [
    { name: 'indeed', fn: scrapeIndeed },
    { name: 'hellowork', fn: scrapeHelloWork },
    { name: 'arbeitnow', fn: scrapeArbeitnow },
    { name: 'remotive', fn: scrapeRemotive },
    { name: 'adzuna', fn: scrapeAdzuna },
    { name: 'francetravail', fn: scrapeFranceTravail },
  ]

  const results = await Promise.allSettled(
    scrapers.map(s => s.fn(query, location))
  )

  const offers: ScraperResult[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`[scraper:${scrapers[i].name}] ${result.value.length} offers`)
      offers.push(...result.value)
    } else {
      console.error(`[scraper:${scrapers[i].name}] failed:`, result.reason)
    }
  })

  // Deduplicate by apply_url
  const seen = new Set<string>()
  return offers.filter(o => {
    if (!o.apply_url || seen.has(o.apply_url)) return false
    seen.add(o.apply_url)
    return true
  })
}
