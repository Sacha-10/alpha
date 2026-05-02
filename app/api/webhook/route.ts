import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function getUserId(sub: Stripe.Subscription): Promise<string | null> {
  const customer = await stripe.customers.retrieve(
    sub.customer as string
  ) as Stripe.Customer
  return customer.metadata?.userId ?? null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json(
      { error: 'Webhook invalide' },
      { status: 400 }
    )
  }

  const admin = getSupabaseAdmin()

  // ── checkout.session.completed ────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, planName, analysesLimit } = session.metadata!
    const subscriptionId = session.subscription as string

    const nextReset = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    )

    await admin.from('users').update({
      subscription_status: 'active',
      subscription_plan: planName,
      analyses_limit: parseInt(analysesLimit),
      analyses_used: 0,
      analyses_reset_date: nextReset.toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
    }).eq('id', userId)

    // Persist plan info in subscription metadata so the
    // customer.subscription.updated handler can read it
    await stripe.subscriptions.update(subscriptionId, {
      metadata: { planName, analysesLimit },
    })
  }

  // ── customer.subscription.updated ────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const prev = event.data.previous_attributes as any
    const userId = await getUserId(sub)
    if (!userId) return NextResponse.json({ received: true })

    // 3. RÉSILIATION — cancel_at_period_end vient de passer à true
    // Garder le statut 'active' ; customer.subscription.deleted
    // se déclenchera à la fin de la période
    if (sub.cancel_at_period_end && prev?.cancel_at_period_end === false) {
      await admin.from('users').update({
        subscription_status: 'active',
      }).eq('id', userId)
      return NextResponse.json({ received: true })
    }

    const newLimit = parseInt(sub.metadata?.analysesLimit ?? '0')
    const newPlanName = sub.metadata?.planName ?? ''
    if (!newLimit || !newPlanName) return NextResponse.json({ received: true })

    const { data: userData } = await admin
      .from('users')
      .select('analyses_limit')
      .eq('id', userId)
      .single()
    if (!userData) return NextResponse.json({ received: true })

    const dbLimit = userData.analyses_limit as number

    // Un changement d'items dans previous_attributes = changement de plan
    const isPlanChange = prev?.items !== undefined

    if (isPlanChange) {
      // 1. UPGRADE — mettre à jour analyses_limit immédiatement
      if (newLimit > dbLimit) {
        await admin.from('users').update({
          subscription_plan: newPlanName,
          analyses_limit: newLimit,
          subscription_status: 'active',
        }).eq('id', userId)
      }
      // 2. DOWNGRADE — ne rien changer maintenant ;
      //    la DB garde l'ancien quota jusqu'au renouvellement
    } else {
      // Renouvellement de période ou autre mise à jour sans changement de plan
      const isPeriodRenewal = prev?.current_period_end !== undefined
      if (isPeriodRenewal && newLimit < dbLimit) {
        // 2. DOWNGRADE — appliquer le changement différé au renouvellement
        await admin.from('users').update({
          subscription_plan: newPlanName,
          analyses_limit: newLimit,
        }).eq('id', userId)
      }
    }
  }

  // ── customer.subscription.deleted ────────────────────────────────
  // Se déclenche après l'expiration de cancel_at_period_end :
  // couper l'accès seulement maintenant
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    const customer = await stripe.customers.retrieve(
      customerId
    ) as Stripe.Customer

    const userId = customer.metadata?.userId
    const update = {
      subscription_status: 'canceled',
      subscription_plan: 'starter',
      analyses_limit: 4,
    }

    if (userId) {
      await admin.from('users').update(update).eq('id', userId)
    } else if (customer.email) {
      await admin.from('users').update(update).eq('email', customer.email)
    } else {
      console.error(
        'webhook: impossible d\'identifier l\'utilisateur pour suppression abonnement',
        customerId
      )
    }
  }

  return NextResponse.json({ received: true })
}
