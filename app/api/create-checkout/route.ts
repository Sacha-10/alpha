import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS, DISABLED_PLANS } from '@/lib/plans'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planKey = searchParams.get('plan') as keyof typeof PLANS
  const annual = searchParams.get('billing') === 'annual'
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const supabase = getSupabase()

  const { data: { user } } = await supabase.auth.getUser(token)

  if (!user) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  const plan = PLANS[planKey]

  if (!plan) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  // Plan désactivé à la vente (cf. DISABLED_PLANS, source unique). Bloque en
  // amont les DEUX chemins (nouvel abonnement ET modification d'abo existant),
  // avant tout appel Stripe. Réactivation = retirer le plan de DISABLED_PLANS.
  if (DISABLED_PLANS.includes(planKey)) {
    return NextResponse.json({ error: 'Plan indisponible' }, { status: 403 })
  }

  const priceId = annual ? plan.stripePriceAnnual : plan.stripePriceMonthly

  // Vérifier si l'utilisateur a déjà un abonnement actif
  const { data: dbUser, error: dbUserError } = await supabase
    .from('users')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

  // Sans lecture fiable de l'état d'abonnement, on refuse : traiter une
  // erreur DB comme « pas d'abonnement » créerait un second abonnement.
  if (dbUserError) {
    console.error('create-checkout: échec lecture abonnement existant — userId:', user.id, JSON.stringify(dbUserError))
    return NextResponse.json(
      { error: 'Impossible de vérifier votre abonnement. Réessayez dans quelques instants.' },
      { status: 500 }
    )
  }

  const hasActiveSub =
    dbUser?.stripe_subscription_id &&
    dbUser?.subscription_status === 'active'

  if (hasActiveSub) {
    try {
      const currentSub = await stripe.subscriptions.retrieve(
        dbUser.stripe_subscription_id
      )
      const itemId = currentSub.items.data[0].id

      await stripe.subscriptions.update(dbUser.stripe_subscription_id, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: 'none',
        metadata: {
          planName: planKey,
          analysesLimit: plan.limit.toString(),
        },
      })

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?updated=true`
      )
    } catch (err) {
      // Jamais de second abonnement : un user déjà abonné ne doit en aucun
      // cas atteindre la création d'un nouveau customer + checkout.
      console.error('create-checkout: échec mise à jour abonnement — userId:', user.id, err)
      return NextResponse.json(
        { error: 'Impossible de modifier votre abonnement. Réessayez ou contactez le support.' },
        { status: 500 }
      )
    }
  }

  // Nouvel abonnement
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { userId: user.id },
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId: user.id,
      planName: planKey,
      analysesLimit: plan.limit.toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  })

  return NextResponse.redirect(session.url!)
}