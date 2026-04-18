export interface Profile {
  id: string
  created_at: string
  full_name: string | null
  email: string | null
  phone: string | null
  location: string | null
  job_title_target: string | null
  job_type: string[]
}

export interface Skill {
  id: string
  profile_id: string
  name: string
  category: 'technical' | 'soft'
}

export interface Experience {
  id: string
  profile_id: string
  title: string | null
  company: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  technologies: string[]
  results: string | null
  position: number
}

export interface Education {
  id: string
  profile_id: string
  degree: string | null
  school: string | null
  field: string | null
  start_date: string | null
  end_date: string | null
}

export interface JobOffer {
  id: string
  scraped_at: string
  source: string
  title: string | null
  company: string | null
  location: string | null
  description: string | null
  skills_required: string[]
  contract_type: string | null
  apply_url: string
  is_expired: boolean
}

export interface JobMatch {
  id: string
  profile_id: string
  job_offer_id: string
  score: number
  matched_keywords: string[]
  created_at: string
}
