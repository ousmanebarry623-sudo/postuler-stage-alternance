import { ScraperResult } from './types'
import { scrape as scrapeLinkedIn } from './linkedin'
import { scrape as scrapeIndeed } from './indeed'
import { scrape as scrapeWTJ } from './welcometothejungle'
import { scrape as scrapeApec } from './apec'
import { scrape as scrapeHelloWork } from './hellowork'

export async function runAllScrapers(query: string, location: string): Promise<ScraperResult[]> {
  const scrapers = [
    { name: 'linkedin', fn: scrapeLinkedIn },
    { name: 'indeed', fn: scrapeIndeed },
    { name: 'witj', fn: scrapeWTJ },
    { name: 'apec', fn: scrapeApec },
    { name: 'hellowork', fn: scrapeHelloWork },
  ]

  const results = await Promise.allSettled(
    scrapers.map(s => s.fn(query, location))
  )

  const offers: ScraperResult[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      offers.push(...result.value)
    } else {
      console.error(`[scraper:${scrapers[i].name}] failed:`, result.reason)
    }
  })

  return offers
}
