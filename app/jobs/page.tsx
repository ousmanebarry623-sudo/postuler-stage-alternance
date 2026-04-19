'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type JobMatch = {
  id: string
  score: number
  matched_keywords: string[]
  job_offers: {
    id: string
    title: string
    company: string
    location: string
    source: string
    contract_type: string
    scraped_at: string
    apply_url: string
  }
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-100 text-green-800' : score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{score}%</span>
}

const SOURCES = ['linkedin', 'indeed', 'witj', 'apec', 'hellowork']

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [scraping, setScraping] = useState(false)
  const [minScore, setMinScore] = useState(30)
  const [sourceFilter, setSourceFilter] = useState('')
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ min_score: String(minScore) })
    if (sourceFilter) params.set('source', sourceFilter)
    fetch(`/api/jobs?${params}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setJobs(arr)
        if (arr.length > 0) setLastUpdate(arr[0].job_offers?.scraped_at)
        setLoading(false)
      })
  }, [minScore, sourceFilter])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const triggerScrape = async () => {
    setScraping(true)
    await fetch('/api/scrape/trigger', {
      method: 'POST',
    })
    setScraping(false)
    fetchJobs()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offres d&apos;emploi</h1>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-0.5">
              Mise à jour : {new Date(lastUpdate).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
        <button onClick={triggerScrape} disabled={scraping}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm font-medium">
          {scraping ? 'Recherche...' : '↻ Actualiser'}
        </button>
      </div>

      <div className="flex gap-4 flex-wrap items-center bg-gray-50 rounded-xl p-3 border">
        <label className="flex items-center gap-2 text-sm">
          Score min :
          <input type="number" min={0} max={100} value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value) || 0)}
            className="border rounded-lg p-1.5 w-16 text-center text-sm" />
        </label>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="border rounded-lg p-1.5 text-sm">
          <option value="">Tous les sites</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Chargement...</div>
      ) : jobs.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-gray-500">
          <p className="text-lg mb-2">Aucune offre trouvée</p>
          <p className="text-sm">Complétez votre <Link href="/profile" className="text-blue-600 underline">profil</Link> puis cliquez sur Actualiser.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(match => (
            <div key={match.id} className="border rounded-xl p-4 flex items-start justify-between gap-4 bg-white shadow-sm hover:shadow transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ScoreBadge score={match.score} />
                  <span className="text-xs text-gray-400 capitalize">{match.job_offers?.source}</span>
                  {match.job_offers?.contract_type && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{match.job_offers.contract_type}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{match.job_offers?.title}</h3>
                <p className="text-sm text-gray-500">{match.job_offers?.company} — {match.job_offers?.location}</p>
                {match.matched_keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {match.matched_keywords.slice(0, 5).map(kw => (
                      <span key={kw} className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{kw}</span>
                    ))}
                    {match.matched_keywords.length > 5 && (
                      <span className="text-xs text-gray-400">+{match.matched_keywords.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link href={`/jobs/${match.job_offers?.id}`}
                  className="text-blue-600 text-sm text-center hover:underline">Détail</Link>
                <a href={match.job_offers?.apply_url} target="_blank" rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm text-center hover:bg-blue-700 transition">
                  Voir
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
