const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en',
  'au', 'aux', 'pour', 'par', 'sur', 'dans', 'avec', 'est', 'sont',
  'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'with', 'and',
  'or', 'is', 'are', 'be', 'been', 'you', 'we', 'our', 'your',
  'nous', 'vous', 'que', 'qui', 'se', 'pas', 'plus', 'tout', 'its',
])

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàâçéèêëîïôùûü0-9\s+#]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
}

export function extractProfileKeywords(profile: {
  skills: Array<{ name: string }>
  experiences: Array<{ description: string | null; technologies: string[] }>
}): string[] {
  const skillWords = profile.skills.flatMap(s => extractKeywords(s.name))
  const techWords = profile.experiences.flatMap(e => e.technologies.flatMap(t => extractKeywords(t)))
  const descWords = profile.experiences.flatMap(e => extractKeywords(e.description ?? ''))

  const all = [...skillWords, ...techWords, ...descWords]
  return all.filter((w, i, arr) => arr.indexOf(w) === i)
}
