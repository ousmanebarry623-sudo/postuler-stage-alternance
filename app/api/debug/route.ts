import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { scrape as scrapeIndeed } from '@/lib/scrapers/indeed'
import { scrape as scrapeHelloWork } from '@/lib/scrapers/hellowork'
import { scrape as scrapeRemotive } from '@/lib/scrapers/remotive'
import { scrape as scrapeAdzuna } from '@/lib/scrapers/adzuna'
import { computeScore } from '@/lib/matching/score'

export const maxDuration = 60

export async function GET() {
  const report: Record<string, unknown> = {}

  // 1. Check env vars
  report.env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? '✅ set' : '❌ missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ missing (using anon)',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ set' : '❌ missing',
    ADZUNA_APP_ID: process.env.ADZUNA_APP_ID ? '✅ set' : '⚠️ not set (optional)',
    ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY ? '✅ set' : '⚠️ not set (optional)',
    FRANCE_TRAVAIL_CLIENT_ID: process.env.FRANCE_TRAVAIL_CLIENT_ID ? '✅ set' : '⚠️ not set (optional)',
  }

  // 2. Fetch profile from Supabase
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, skills(*), experiences(*)')
      .limit(1)
      .single()

    if (error) {
      report.profile = { status: '❌ error', error: error.message, code: error.code }
    } else if (!profile) {
      report.profile = { status: '❌ no profile found' }
    } else {
      report.profile = {
        status: '✅ found',
        id: profile.id?.substring(0, 8),
        job_title_target: profile.job_title_target,
        location: profile.location,
        skills_count: profile.skills?.length ?? 0,
        experiences_count: profile.experiences?.length ?? 0,
      }

      const query = profile.job_title_target ?? ''
      const location = profile.location ?? 'France'

      // 3. Test each scraper individually
      report.scrapers = {}

      const scrapers = [
        { name: 'indeed', fn: scrapeIndeed },
        { name: 'hellowork', fn: scrapeHelloWork },
        { name: 'remotive', fn: scrapeRemotive },
        { name: 'adzuna', fn: scrapeAdzuna },
      ]

      for (const { name, fn } of scrapers) {
        try {
          const start = Date.now()
          const results = await fn(query, location)
          const elapsed = Date.now() - start
          ;(report.scrapers as Record<string, unknown>)[name] = {
            status: results.length > 0 ? '✅' : '⚠️ 0 results',
            count: results.length,
            elapsed_ms: elapsed,
            sample: results.slice(0, 2).map(r => ({ title: r.title, company: r.company, url: r.apply_url?.substring(0, 60) })),
          }
        } catch (err) {
          ;(report.scrapers as Record<string, unknown>)[name] = {
            status: '❌ error',
            error: String(err),
          }
        }
      }

      // 4. Test score computation with a sample offer
      try {
        const sampleOffer = {
          title: query,
          description: `Stage alternance ${query} ${location}`,
          skills_required: profile.skills?.map((s: { name: string }) => s.name) ?? [],
        }
        const { score, matched_keywords } = computeScore(sampleOffer, profile)
        report.score_test = {
          status: '✅',
          sample_score: score,
          matched_keywords,
          profile_keywords_count: profile.skills?.length ?? 0,
        }
      } catch (err) {
        report.score_test = { status: '❌ error', error: String(err) }
      }

      // 5. Check existing job_offers in DB
      const { data: existingOffers, error: offersError } = await supabase
        .from('job_offers')
        .select('id, title, source')
        .limit(5)
      report.existing_offers_in_db = {
        status: offersError ? `❌ ${offersError.message}` : '✅',
        count_shown: existingOffers?.length ?? 0,
        sample: existingOffers?.map(o => ({ title: o.title, source: o.source })),
      }

      // 6. Check existing job_matches in DB
      const { data: existingMatches, error: matchError } = await supabase
        .from('job_matches')
        .select('id, score')
        .limit(5)
      report.existing_matches_in_db = {
        status: matchError ? `❌ ${matchError.message}` : '✅',
        count_shown: existingMatches?.length ?? 0,
        sample_scores: existingMatches?.map(m => m.score),
      }
    }
  } catch (err) {
    report.profile = { status: '❌ exception', error: String(err) }
  }

  return NextResponse.json(report, { status: 200 })
}
