import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from
  '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analyzeTrades } from '@/lib/openai'
import Stripe from 'stripe'

const PLAN_LIMITS: Record<string, number> = {
  starter: 4,
  pro: 24,
  elite: 999999,
}

// Rate limiting en mémoire — 1 requête toutes les 15 secondes par utilisateur
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 15_000

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ 
    cookies 
  })
  
  const { data: { user } } = await 
    supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Non autorisé' }, 
      { status: 401 }
    )
  }
  
  const lastCall = rateLimitMap.get(user.id) ?? 0
  if (Date.now() - lastCall < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Patientez quelques secondes.' },
      { status: 429 }
    )
  }
  rateLimitMap.set(user.id, Date.now())

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!userData) {
    return NextResponse.json(
      { error: 'Utilisateur introuvable' },
      { status: 404 }
    )
  }
  
  // Reset basé sur la période de facturation Stripe (current_period_start)
  const resetDate = new Date(userData.analyses_reset_date)
  let periodStart: Date | null = null

  if (userData.subscription_status === 'active') {
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${user.id}'`,
      expand: ['data.subscriptions'],
    })
    const customer = customers.data[0]
    const activeSub = customer?.subscriptions?.data.find(
      (s) => s.status === 'active'
    )
    if (activeSub) {
      periodStart = new Date(activeSub.current_period_start * 1000)
    }
  }

  if (periodStart !== null && resetDate < periodStart) {
    await supabase.from('users')
      .update({
        analyses_used: 0,
        analyses_reset_date: periodStart.toISOString(),
      })
      .eq('id', user.id)
    userData.analyses_used = 0
  }
  
  const limit = PLAN_LIMITS[
    userData.subscription_plan || 'starter'
  ]
  
  if (userData.analyses_used >= limit) {
    return NextResponse.json(
      { 
        error: `Vous avez utilisé toutes vos analyses 
        ce mois-ci. Passez au plan supérieur 
        pour continuer.`,
        upgrade: true
      },
      { status: 403 }
    )
  }
  
  const { trades } = await req.json()
  const report = await analyzeTrades(trades)
  
  await supabase.from('users')
    .update({ 
      analyses_used: userData.analyses_used + 1 
    })
    .eq('id', user.id)
  
  await supabase.from('analyses')
    .insert({
      user_id: user.id,
      report,
      created_at: new Date().toISOString()
    })
  
  return NextResponse.json({
    ...report,
    analysesLeft: limit - userData.analyses_used - 1,
    analysesLimit: limit,
  })
}
