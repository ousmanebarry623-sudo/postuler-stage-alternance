import { ScraperResult } from './types'

function randomDelay(min = 300, max = 800) {
  return new Promise(r => setTimeout(r, Math.random() * (max - min) + min))
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
]

export async function scrape(query: string, location: string): Promise<ScraperResult[]> {
  const chromium = await import('@sparticuz/chromium')
  const { chromium: playwright } = await import('playwright-core')

  const browser = await playwright.launch({
    args: chromium.default.args,
    executablePath: await chromium.default.executablePath(),
    headless: true,
  })

  const context = await browser.newContext({
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
  })

  const page = await context.newPage()
  const results: ScraperResult[] = []

  try {
    const url = `https://www.apec.fr/candidat/recherche-emploi.html/emploi?motsCles=${encodeURIComponent(query)}&lieuTravail=${encodeURIComponent(location)}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await randomDelay()

    const cards = await page.$$('.item-offer')

    for (const card of cards.slice(0, 20)) {
      await randomDelay(100, 300)
      const title = await card.$eval('.title-offer', el => el.textContent?.trim() ?? '').catch(() => '')
      const company = await card.$eval('.title-company', el => el.textContent?.trim() ?? '').catch(() => '')
      const loc = await card.$eval('.location-offer', el => el.textContent?.trim() ?? '').catch(() => '')
      const linkEl = await card.$('a.item-offer-link')
      const href = linkEl ? await linkEl.getAttribute('href') : null
      const link = href ? `https://www.apec.fr${href}` : ''

      if (!link || !title) continue

      results.push({
        title,
        company,
        location: loc,
        description: '',
        skills_required: [],
        contract_type: '',
        apply_url: link,
        source: 'apec',
      })
    }
  } finally {
    await browser.close()
  }

  return results
}
