import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { computeScore } from '@/lib/matching/score'
import { scrape as scrapeIndeed } from '@/lib/scrapers/indeed'
import { scrape as scrapeHelloWork } from '@/lib/scrapers/hellowork'
import { scrape as scrapeArbeitnow } from '@/lib/scrapers/arbeitnow'
import { scrape as scrapeRemotive } from '@/lib/scrapers/remotive'
import { scrape as scrapeAdzuna } from '@/lib/scrapers/adzuna'
import { scrape as scrapeFranceTravail } from '@/lib/scrapers/francetravail'
import { ScraperResult } from '@/lib/scrapers/types'

export const maxDuration = 60

export async function POST() {
  // 1. Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, skills(*), experiences(*)')
    .limit(1)
    .single()

  if (profileError || !profile) {
    console.error('[trigger] profile error:', profileError)
    return NextResponse.json({
      error: 'Profil introuvable. Créez votre profil d\'abord.',
      detail: profileError?.message
    }, { status: 404 })
  }

  const query = profile.job_title_target ?? ''
  const location = profile.location ?? 'France'

  if (!query) {
    return NextResponse.json({ error: 'Ajoutez un poste recherché dans votre profil.' }, { status: 400 })
  }

  console.log('[trigger] scraping for:', query, 'in', location)

  // 2. Run scrapers individually with per-source logging
  const scraperDefs = [
    { name: 'indeed', fn: scrapeIndeed },
    { name: 'hellowork', fn: scrapeHelloWork },
    { name: 'arbeitnow', fn: scrapeArbeitnow },
    { name: 'remotive', fn: scrapeRemotive },
    { name: 'adzuna', fn: scrapeAdzuna },
    { name: 'francetravail', fn: scrapeFranceTravail },
  ]

  const scraperStats: Record<string, { count: number; error?: string }> = {}
  const allOffers: ScraperResult[] = []

  await Promise.allSettled(
    scraperDefs.map(async ({ name, fn }) => {
      try {
        const results = await fn(query, location)
        scraperStats[name] = { count: results.length }
        allOffers.push(...results)
      } catch (err) {
        scraperStats[name] = { count: 0, error: String(err) }
        console.error(`[trigger:${name}] error:`, err)
      }
    })
  )

  console.log('[trigger] scraper stats:', JSON.stringify(scraperStats))

  // 3. Deduplicate by apply_url
  const seen = new Set<string>()
  const offers = allOffers.filter(o => {
    if (!o.apply_url || seen.has(o.apply_url)) return false
    seen.add(o.apply_url)
    return true
  })

  console.log('[trigger] total unique offers:', offers.length)

  // 4. Save to DB
  if (offers.length > 0) {
    const { error: upsertErr } = await supabase.from('job_offers').upsert(offers, { onConflict: 'apply_url' })
    if (upsertErr) console.error('[trigger] upsert error:', upsertErr)
  }

  // 5. Compute matches for ALL non-expired offers
  const { data: allDbOffers } = await supabase
    .from('job_offers')
    .select('*')
    .eq('is_expired', false)

  const matches = (allDbOffers ?? []).map(offer => {
    const { score, matched_keywords } = computeScore(offer, profile)
    return { profile_id: profile.id, job_offer_id: offer.id, score, matched_keywords }
  })

  if (matches.length > 0) {
    await supabase.from('job_matches').upsert(matches, { onConflict: 'profile_id,job_offer_id' })
  }

  return NextResponse.json({
    scraped: offers.length,
    matched: matches.length,
    sources: scraperStats,
  })
}
