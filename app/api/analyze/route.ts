import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { analyzeTradesMember } from '@/lib/openai'
import { getPlanLimit } from '@/lib/plans'
import Stripe from 'stripe'

export const maxDuration = 60

// Rate limiting en mémoire — 1 requête toutes les 15 secondes par utilisateur
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 15_000

// Dernier anniversaire mensuel de periodStart antérieur ou égal à `now`, en UTC.
// Mensuel : current_period_start avance chaque mois → cycleStart = periodStart.
// Annuel : current_period_start ne bouge qu'une fois par an, on avance donc mois
// par mois depuis cette ancre. Jour 29/30/31 absent du mois cible : clamp au
// dernier jour du mois (convention Stripe).
function getCycleStart(periodStart: Date, now: Date): Date {
  const anchorDay = periodStart.getUTCDate()

  const anniversary = (monthsAfterStart: number): Date => {
    const totalMonths = periodStart.getUTCMonth() + monthsAfterStart
    const year = periodStart.getUTCFullYear() + Math.floor(totalMonths / 12)
    const month = ((totalMonths % 12) + 12) % 12
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return new Date(Date.UTC(
      year, month, Math.min(anchorDay, lastDayOfMonth),
      periodStart.getUTCHours(), periodStart.getUTCMinutes(),
      periodStart.getUTCSeconds(), periodStart.getUTCMilliseconds()
    ))
  }

  const elapsedMonths =
    (now.getUTCFullYear() - periodStart.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - periodStart.getUTCMonth())

  const candidate = anniversary(elapsedMonths)
  return candidate <= now ? candidate : anniversary(elapsedMonths - 1)
}

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

    // Statut actif garanti en amont par le proxy (garde centralisée). Ici on ne
    // vérifie que la LIMITE d'analyses du plan, spécifique à cette route.

    // Reset mensuel ancré sur le cycle Stripe : quel que soit le rythme de
    // facturation (mensuel ou annuel), le quota se réinitialise à chaque
    // anniversaire mensuel de current_period_start (cycleStart).
    let periodStart: Date | null = null

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

    if (periodStart !== null) {
      const cycleStart = getCycleStart(periodStart, new Date())
      const resetDate = userData.analyses_reset_date
        ? new Date(userData.analyses_reset_date)
        : null

      if (resetDate === null || isNaN(resetDate.getTime()) || resetDate < cycleStart) {
        const { error: resetError } = await supabase.from('users')
          .update({
            analyses_used: 0,
            analyses_reset_date: cycleStart.toISOString(),
          })
          .eq('id', user.id)

        if (resetError) {
          // Échec du reset : on garde le compteur actuel (cohérent avec la
          // base) plutôt que d'offrir un quota non persisté.
          console.error('[/api/analyze] Erreur reset quota:', JSON.stringify(resetError))
        } else {
          userData.analyses_used = 0
        }
      }
    }

    const limit = getPlanLimit(userData.subscription_plan)

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

    // Incrément atomique côté base (RPC), à l'abri des requêtes concurrentes.
    const { data: newUsed, error: incrementError } = await supabase.rpc(
      'increment_analyses_used',
      { p_user_id: user.id }
    )
    if (incrementError) {
      console.error('[/api/analyze] Erreur RPC increment_analyses_used:', JSON.stringify(incrementError))
    }

    await supabase.from('member_analyses')
      .insert({
        user_id: user.id,
        report,
        plan: userData.subscription_plan,
        created_at: new Date().toISOString()
      })

    const usedAfter = typeof newUsed === 'number'
      ? newUsed
      : userData.analyses_used + 1

    return NextResponse.json({
      ...report,
      analysesLeft: limit - usedAfter,
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
