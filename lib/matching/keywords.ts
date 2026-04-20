const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en',
  'au', 'aux', 'pour', 'par', 'sur', 'dans', 'avec', 'est', 'sont',
  'the', 'a', 'an', 'of', 'to', 'in', 'for', 'on', 'with', 'and',
  'or', 'is', 'are', 'be', 'been', 'you', 'we', 'our', 'your',
  'nous', 'vous', 'que', 'qui', 'se', 'pas', 'plus', 'tout', 'its',
  'this', 'that', 'from', 'by', 'at', 'as', 'it', 'all', 'has',
  'have', 'will', 'can', 'may', 'aussi', 'cette', 'ces', 'leur',
])

// Short tech terms that must NOT be filtered by length
const TECH_SHORT = new Set(['c', 'r', 'go', 'qt', 'ai', 'ml', 'js', 'ts', 'ui', 'ux', 'io'])

// FR↔EN synonym pairs — both directions are added
const SYNONYMS: [string, string][] = [
  ['électronique', 'electronics'],
  ['electronique', 'electronics'],
  ['informatique', 'computer'],
  ['informatique', 'software'],
  ['embarqué', 'embedded'],
  ['embarque', 'embedded'],
  ['industrielle', 'industrial'],
  ['industriel', 'industrial'],
  ['ingénieur', 'engineer'],
  ['ingenieur', 'engineer'],
  ['développeur', 'developer'],
  ['developpeur', 'developer'],
  ['développement', 'development'],
  ['developpement', 'development'],
  ['réseau', 'network'],
  ['réseau', 'networking'],
  ['système', 'system'],
  ['systeme', 'system'],
  ['automatisme', 'automation'],
  ['automatisme', 'plc'],
  ['programmation', 'programming'],
  ['stage', 'internship'],
  ['alternance', 'apprenticeship'],
  ['alternance', 'apprentice'],
  ['microcontrôleur', 'microcontroller'],
  ['microcontroleur', 'microcontroller'],
  ['conception', 'design'],
  ['logiciel', 'software'],
  ['matériel', 'hardware'],
  ['materiel', 'hardware'],
  ['temps réel', 'real-time'],
  ['rtos', 'embedded'],
  ['protocole', 'protocol'],
  ['communication', 'communication'],
  ['signal', 'signal'],
  ['traitement', 'processing'],
  ['traitement signal', 'signal processing'],
  ['apprentissage', 'machine learning'],
  ['intelligence artificielle', 'artificial intelligence'],
]

// Build a fast synonym lookup: word → set of synonyms
const SYNONYM_MAP = new Map<string, Set<string>>()
for (const [fr, en] of SYNONYMS) {
  if (!SYNONYM_MAP.has(fr)) SYNONYM_MAP.set(fr, new Set())
  if (!SYNONYM_MAP.has(en)) SYNONYM_MAP.set(en, new Set())
  SYNONYM_MAP.get(fr)!.add(en)
  SYNONYM_MAP.get(en)!.add(fr)
}

export function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents for matching
    .replace(/[^a-z0-9\s#+]/g, ' ')
    .split(/\s+/)
    .filter(w => (w.length > 2 || TECH_SHORT.has(w)) && !STOP_WORDS.has(w))

  // Expand with synonyms
  const expanded = new Set<string>(words)
  for (const w of words) {
    const syns = SYNONYM_MAP.get(w)
    if (syns) syns.forEach(s => expanded.add(s))
  }

  return [...expanded]
}

export function extractProfileKeywords(profile: {
  skills: Array<{ name: string }>
  experiences: Array<{ description: string | null; technologies: string[] }>
}): string[] {
  const skillWords = profile.skills.flatMap(s => extractKeywords(s.name))
  const techWords = profile.experiences.flatMap(e =>
    (e.technologies ?? []).flatMap(t => extractKeywords(t))
  )
  const descWords = profile.experiences.flatMap(e => extractKeywords(e.description ?? ''))

  const all = [...skillWords, ...techWords, ...descWords]
  return all.filter((w, i, arr) => arr.indexOf(w) === i)
}
