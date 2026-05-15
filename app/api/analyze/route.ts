import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { analyzeTradesMember } from '@/lib/openai'
import Stripe from 'stripe'

export const maxDuration = 60

const PLAN_LIMITS: Record<string, number> = {
  pro: 4,
  premium: 24,
  elite: 999999,
}

// Rate limiting en mémoire — 1 requête toutes les 15 secondes par utilisateur
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 15_000

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

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

    if (userData.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Un abonnement actif est requis pour accéder aux analyses.', upgrade: true },
        { status: 403 }
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
    const report = await analyzeTradesMember(trades)

    await supabase.from('users')
      .update({
        analyses_used: userData.analyses_used + 1
      })
      .eq('id', user.id)

    const { data: analysisData } = await supabase.from('analyses')
      .insert({
        user_id: user.id,
        report,
        plan: userData.subscription_plan,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (analysisData?.id && trades?.length) {
      const tradesToInsert = trades.map((trade: any) => ({
        user_id: user.id,
        analysis_id: analysisData.id,
        opened_at: trade.openedAt ? new Date(trade.openedAt).toISOString() : null,
        closed_at: trade.closedAt ? new Date(trade.closedAt).toISOString() : null,
        symbol: trade.symbol ?? null,
        side: trade.side ?? null,
        entry: trade.entry ?? null,
        exit: trade.exit ?? null,
        volume: trade.volume ?? null,
        profit: trade.profit ?? null,
        created_at: new Date().toISOString()
      }))

      await supabase.from('trades').insert(tradesToInsert)
    }

    return NextResponse.json({
      ...report,
      analysesLeft: limit - userData.analyses_used - 1,
      analysesLimit: limit,
    })
  } catch (error: any) {
    console.error('[/api/analyze] Erreur 500:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      code: error?.code,
      stack: error?.stack,
    })
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
