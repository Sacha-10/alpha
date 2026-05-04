import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS } from '@/lib/plans'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(req: NextRequest) {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)

  if (!user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const { searchParams } = new URL(req.url)
  const planKey = searchParams.get('plan') as keyof typeof PLANS
  const annual = searchParams.get('billing') === 'annual'
  const plan = PLANS[planKey]

  if (!plan) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const priceId = annual ? plan.stripePriceAnnual : plan.stripePriceMonthly

  // Vérifier si l'utilisateur a déjà un abonnement actif
  const { data: dbUser } = await supabase
    .from('users')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .single()

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
      console.error('create-checkout: échec mise à jour abonnement', err)
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