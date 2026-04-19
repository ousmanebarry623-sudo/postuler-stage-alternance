import Link from 'next/link'

async function getJob(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/jobs/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await getJob(id)
  if (!job) return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/jobs" className="text-blue-600 underline text-sm">← Retour</Link>
      <p className="mt-4 text-gray-500">Offre introuvable.</p>
    </div>
  )

  const score = job.match?.score ?? 0
  const matched = job.match?.matched_keywords ?? []
  const scoreColor = score >= 70 ? 'bg-green-100 text-green-800' : score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href="/jobs" className="text-blue-600 underline text-sm">← Retour aux offres</Link>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${scoreColor}`}>Score {score}%</span>
          <span className="text-sm text-gray-400 capitalize">{job.source}</span>
        </div>
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-gray-600 mt-1">{job.company} — {job.location}</p>
      </div>

      {matched.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h2 className="font-semibold text-green-800 mb-2 text-sm">Mots-clés correspondants</h2>
          <div className="flex flex-wrap gap-2">
            {matched.map((kw: string) => (
              <span key={kw} className="px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-sm">{kw}</span>
            ))}
          </div>
        </div>
      )}

      {job.description && (
        <div>
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
      )}

      <div className="border rounded-xl p-4 bg-gray-50 opacity-50 cursor-not-allowed">
        <p className="text-sm font-medium text-gray-500">Générer CV + Lettre de motivation</p>
        <p className="text-xs text-gray-400 mt-0.5">Disponible dans la prochaine version</p>
      </div>

      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
        className="block bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
        Postuler sur {job.source}
      </a>
    </div>
  )
}
