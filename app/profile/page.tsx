'use client'
import { useState, useEffect, useCallback } from 'react'

type Profile = {
  id?: string
  full_name: string
  email: string
  phone: string
  location: string
  job_title_target: string
  job_type: string[]
}

type Skill = { id?: string; name: string; category: 'technical' | 'soft' }
type Experience = {
  id?: string
  title: string; company: string
  start_date: string; end_date: string
  description: string; technologies: string; results: string
}

const JOB_TYPES = ['stage', 'alternance', 'cdi', 'cdd']

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    full_name: '', email: '', phone: '', location: '',
    job_title_target: '', job_type: []
  })
  const [skills, setSkills] = useState<Skill[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [newSkillCategory, setNewSkillCategory] = useState<'technical' | 'soft'>('technical')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data && data.id) {
          const { skills: s, experiences: e, education: _ed, ...p } = data
          setProfile(p)
          setProfileId(p.id)
          setSkills(s ?? [])
          setExperiences((e ?? []).map((exp: Experience & { technologies: string[] }) => ({
            ...exp,
            technologies: Array.isArray(exp.technologies) ? exp.technologies.join(', ') : ''
          })))
        }
      })
      .catch(err => console.error('Erreur chargement profil:', err))
  }, [])

  const saveProfile = useCallback(async () => {
    setSaving(true)
    setSaveStatus('idle')
    setSaveError(null)
    try {
      let res: Response
      if (profileId) {
        res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: profileId, ...profile })
        })
      } else {
        res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile)
        })
      }
      const data = await res.json()
      if (!res.ok) {
        setSaveStatus('error')
        setSaveError(data.error ?? `Erreur ${res.status}`)
      } else {
        if (!profileId) setProfileId(data.id)
        setSaveStatus('ok')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err) {
      setSaveStatus('error')
      setSaveError('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }, [profile, profileId])

  const addSkill = async () => {
    if (!newSkill.trim() || !profileId) return
    const res = await fetch('/api/profile/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, name: newSkill.trim(), category: newSkillCategory })
    })
    if (res.ok) {
      const skill = await res.json()
      setSkills(prev => [...prev, skill])
      setNewSkill('')
    }
  }

  const removeSkill = async (id: string) => {
    await fetch(`/api/profile/skills?id=${id}`, { method: 'DELETE' })
    setSkills(prev => prev.filter(s => s.id !== id))
  }

  const addExperience = async () => {
    if (!profileId || experiences.length >= 10) return
    const res = await fetch('/api/profile/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, title: '', company: '', start_date: null, end_date: null, description: '', technologies: [], results: '', position: experiences.length })
    })
    if (res.ok) {
      const data = await res.json()
      setExperiences(prev => [...prev, { ...data, technologies: '' }])
    }
  }

  const saveExperience = async (exp: Experience) => {
    if (!exp.id) return
    await fetch('/api/profile/experiences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...exp,
        technologies: exp.technologies.split(',').map((t: string) => t.trim()).filter(Boolean),
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
      })
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Mon Profil</h1>

      <section className="space-y-4 bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Informations personnelles</h2>
        <div className="grid grid-cols-2 gap-3">
          {([['full_name', 'Nom complet'], ['email', 'Email'], ['phone', 'Téléphone'], ['location', 'Ville / Région'], ['job_title_target', 'Poste recherché']] as const).map(([field, label]) => (
            <div key={field} className={field === 'job_title_target' ? 'col-span-2' : ''}>
              <label className="text-sm text-gray-600 mb-1 block">{label}</label>
              <input
                className="w-full border rounded-lg p-2 text-sm"
                value={profile[field as keyof Profile] as string}
                onChange={e => setProfile(prev => ({ ...prev, [field]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Types de contrat recherchés</label>
          <div className="flex gap-3 flex-wrap">
            {JOB_TYPES.map(t => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="checkbox" checked={profile.job_type.includes(t)}
                  onChange={e => setProfile(prev => ({
                    ...prev,
                    job_type: e.target.checked ? [...prev.job_type, t] : prev.job_type.filter(x => x !== t)
                  }))}
                  className="rounded"
                />
                {t.toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        {saveStatus === 'error' && saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            ❌ Erreur : {saveError}
          </div>
        )}
        {saveStatus === 'ok' && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
            ✓ Profil sauvegardé avec succès
          </div>
        )}

        <button onClick={saveProfile} disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50 transition">
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>

        {!profileId && (
          <p className="text-xs text-amber-600">⚠ Profil non encore enregistré — cliquez Sauvegarder pour créer votre profil.</p>
        )}
        {profileId && (
          <p className="text-xs text-gray-400">ID : {profileId.substring(0, 8)}…</p>
        )}
      </section>

      {profileId && (
        <section className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Compétences</h2>
          <div className="flex gap-2">
            <input className="border rounded-lg p-2 text-sm flex-1" placeholder="Nouvelle compétence"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
            />
            <select value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value as 'technical' | 'soft')}
              className="border rounded-lg p-2 text-sm">
              <option value="technical">Technique</option>
              <option value="soft">Soft skill</option>
            </select>
            <button onClick={addSkill} className="bg-blue-500 text-white px-3 rounded-lg text-sm">+</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s.id} className={`px-2.5 py-1 rounded-full text-sm flex items-center gap-1 ${s.category === 'technical' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {s.name}
                <button onClick={() => s.id && removeSkill(s.id)} className="text-red-400 hover:text-red-600 ml-0.5">×</button>
              </span>
            ))}
          </div>
        </section>
      )}

      {profileId && (
        <section className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Expériences ({experiences.length}/10)</h2>
            {experiences.length < 10 && (
              <button onClick={addExperience} className="text-blue-600 text-sm underline">+ Ajouter</button>
            )}
          </div>
          {experiences.map((exp, i) => (
            <details key={exp.id ?? i} className="border rounded-lg p-3 group">
              <summary className="cursor-pointer font-medium text-sm list-none flex justify-between items-center">
                <span>{exp.title || exp.company || `Expérience ${i + 1}`}</span>
                <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([['title', 'Titre'], ['company', 'Entreprise']] as const).map(([f, l]) => (
                  <div key={f}>
                    <label className="text-xs text-gray-500">{l}</label>
                    <input className="w-full border rounded p-1.5 text-sm mt-0.5"
                      value={exp[f]}
                      onChange={e => setExperiences(prev => prev.map((x, j) => j === i ? { ...x, [f]: e.target.value } : x))}
                      onBlur={() => saveExperience(exp)}
                    />
                  </div>
                ))}
                {([['start_date', 'Début'], ['end_date', 'Fin']] as const).map(([f, l]) => (
                  <div key={f}>
                    <label className="text-xs text-gray-500">{l}</label>
                    <input type="date" className="w-full border rounded p-1.5 text-sm mt-0.5"
                      value={exp[f]}
                      onChange={e => setExperiences(prev => prev.map((x, j) => j === i ? { ...x, [f]: e.target.value } : x))}
                      onBlur={() => saveExperience(exp)}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Description</label>
                  <textarea className="w-full border rounded p-1.5 text-sm mt-0.5 h-20 resize-none"
                    value={exp.description}
                    onChange={e => setExperiences(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    onBlur={() => saveExperience(exp)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Technologies (séparées par virgule)</label>
                  <input className="w-full border rounded p-1.5 text-sm mt-0.5"
                    value={exp.technologies}
                    onChange={e => setExperiences(prev => prev.map((x, j) => j === i ? { ...x, technologies: e.target.value } : x))}
                    onBlur={() => saveExperience(exp)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Résultats</label>
                  <input className="w-full border rounded p-1.5 text-sm mt-0.5"
                    value={exp.results}
                    onChange={e => setExperiences(prev => prev.map((x, j) => j === i ? { ...x, results: e.target.value } : x))}
                    onBlur={() => saveExperience(exp)}
                  />
                </div>
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
