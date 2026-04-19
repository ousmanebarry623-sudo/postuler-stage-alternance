export interface ScraperResult {
  title: string
  company: string
  location: string
  description: string
  skills_required: string[]
  contract_type: string
  apply_url: string
  source: string
}

export type ScraperFn = (query: string, location: string) => Promise<ScraperResult[]>
