import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runAllScrapers } from '@/lib/scrapers'
import { computeScore } from '@/lib/matching/score'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, skills(*), experiences(*)')
    .limit(1)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'No profile found' }, { status: 404 })
  }

  const query = profile.job_title_target ?? ''
  const location = profile.location ?? 'France'

  const offers = await runAllScrapers(query, location)

  if (offers.length > 0) {
    await supabase.from('job_offers').upsert(offers, { onConflict: 'apply_url' })
  }

  const { data: allOffers } = await supabase
    .from('job_offers')
    .select('*')
    .eq('is_expired', false)

  const matches = (allOffers ?? []).map(offer => {
    const { score, matched_keywords } = computeScore(offer, profile)
    return {
      profile_id: profile.id,
      job_offer_id: offer.id,
      score,
      matched_keywords,
    }
  })

  if (matches.length > 0) {
    await supabase
      .from('job_matches')
      .upsert(matches, { onConflict: 'profile_id,job_offer_id' })
  }

  return NextResponse.json({ scraped: offers.length, matched: matches.length })
}
