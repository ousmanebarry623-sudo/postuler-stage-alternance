import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const minScore = parseInt(searchParams.get('min_score') ?? '30')
  const source = searchParams.get('source')
  const contractType = searchParams.get('contract_type')
  const location = searchParams.get('location')

  const { data, error } = await supabase
    .from('job_matches')
    .select('*, job_offers(*)')
    .gte('score', minScore)
    .order('score', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let results = data ?? []

  if (source) {
    results = results.filter((m: any) => m.job_offers?.source === source)
  }
  if (contractType) {
    results = results.filter((m: any) => m.job_offers?.contract_type === contractType)
  }
  if (location) {
    results = results.filter((m: any) =>
      m.job_offers?.location?.toLowerCase().includes(location.toLowerCase())
    )
  }

  return NextResponse.json(results)
}
