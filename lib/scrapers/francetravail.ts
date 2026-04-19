import { ScraperResult } from './types'

// France Travail (ex Pôle Emploi) API - free, official
// Register at: https://francetravail.io/data/api/offres-emploi
// Requires FRANCE_TRAVAIL_CLIENT_ID + FRANCE_TRAVAIL_CLIENT_SECRET
export async function scrape(query: string, _location: string): Promise<ScraperResult[]> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[francetravail] Missing credentials — skipping')
    return []
  }

  // Get access token
  const tokenRes = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'api_offresdemploiv2 o2dsoffre',
    }),
  })

  if (!tokenRes.ok) {
    console.error('[francetravail] Token error', tokenRes.status)
    return []
  }

  const { access_token } = await tokenRes.json()

  const params = new URLSearchParams({
    motsCles: query,
    range: '0-19',
  })

  const res = await fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?${params}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    console.error('[francetravail] Search error', res.status)
    return []
  }

  const data = await res.json()
  const jobs = data.resultats ?? []

  return jobs.map((job: {
    intitule?: string
    entreprise?: { nom?: string }
    lieuTravail?: { libelle?: string }
    description?: string
    typeContrat?: string
    origineOffre?: { urlOrigine?: string }
    id?: string
  }) => ({
    title: job.intitule ?? '',
    company: job.entreprise?.nom ?? '',
    location: job.lieuTravail?.libelle ?? '',
    description: job.description ?? '',
    skills_required: [],
    contract_type: job.typeContrat ?? '',
    apply_url: job.origineOffre?.urlOrigine ?? `https://candidat.francetravail.fr/offres/recherche/detail/${job.id}`,
    source: 'francetravail',
  })).filter((j: ScraperResult) => j.apply_url && j.title)
}
