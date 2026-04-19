import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runAllScrapers } from '@/lib/scrapers'
import { computeScore } from '@/lib/matching/score'

export const maxDuration = 60

// Public endpoint called from the browser — runs scraping directly (no self-HTTP)
export async function POST() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, skills(*), experiences(*)')
    .limit(1)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profil introuvable. Créez votre profil d\'abord.' }, { status: 404 })
  }

  const query = profile.job_title_target ?? ''
  const location = profile.location ?? 'France'

  if (!query) {
    return NextResponse.json({ error: 'Ajoutez un poste recherché dans votre profil.' }, { status: 400 })
  }

  let offers: Awaited<ReturnType<typeof runAllScrapers>> = []
  try {
    offers = await runAllScrapers(query, location)
  } catch (e) {
    console.error('Scraping failed:', e)
    return NextResponse.json({ error: 'Le scraping a échoué. Réessayez plus tard.' }, { status: 500 })
  }

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
