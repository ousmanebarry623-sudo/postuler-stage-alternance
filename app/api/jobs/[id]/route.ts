import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: offer, error: offerError } = await supabase
    .from('job_offers')
    .select('*')
    .eq('id', id)
    .single()

  if (offerError) return NextResponse.json({ error: offerError.message }, { status: 404 })

  const { data: match } = await supabase
    .from('job_matches')
    .select('score, matched_keywords')
    .eq('job_offer_id', id)
    .single()

  return NextResponse.json({ ...offer, match })
}
