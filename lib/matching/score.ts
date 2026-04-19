import { extractKeywords, extractProfileKeywords } from './keywords'

interface OfferData {
  title: string | null
  description: string | null
  skills_required: string[]
}

interface ProfileData {
  skills: Array<{ name: string }>
  experiences: Array<{ description: string | null; technologies: string[] }>
}

export function computeScore(offer: OfferData, profile: ProfileData): {
  score: number
  matched_keywords: string[]
} {
  const profileKeywords = new Set(extractProfileKeywords(profile))

  const titleKeywords = extractKeywords(offer.title ?? '')
  const skillKeywords = offer.skills_required.flatMap(s => extractKeywords(s))
  const descKeywords = extractKeywords(offer.description ?? '')

  const weightedMatches: Record<string, number> = {}
  let totalWeight = 0

  for (const kw of titleKeywords) {
    totalWeight += 2
    if (profileKeywords.has(kw)) weightedMatches[kw] = (weightedMatches[kw] ?? 0) + 2
  }
  for (const kw of skillKeywords) {
    totalWeight += 1.5
    if (profileKeywords.has(kw)) weightedMatches[kw] = (weightedMatches[kw] ?? 0) + 1.5
  }
  for (const kw of descKeywords) {
    totalWeight += 1
    if (profileKeywords.has(kw)) weightedMatches[kw] = (weightedMatches[kw] ?? 0) + 1
  }

  const matchedWeight = Object.values(weightedMatches).reduce((a, b) => a + b, 0)
  const score = totalWeight === 0 ? 0 : Math.min(100, Math.round((matchedWeight / totalWeight) * 100))
  const matched_keywords = Object.keys(weightedMatches)

  return { score, matched_keywords }
}
