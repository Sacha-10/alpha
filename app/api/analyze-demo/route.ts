import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeTrades } from '@/lib/openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') 
    || req.headers.get('x-real-ip') 
    || 'unknown'

  const { data: existing } = await supabase
    .from('demo_usage')
    .select('ip_address')
    .eq('ip_address', ip)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'Vous avez déjà utilisé votre analyse ' +
        'démo. Créez un compte pour analyser vos ' +
        'propres trades.' },
      { status: 429 }
    )
  }

  await supabase
    .from('demo_usage')
    .insert({ ip_address: ip, used_at: new Date() })

  const { trades } = await req.json()
  const report = await analyzeTrades(trades)
  
  return NextResponse.json(report)
}
