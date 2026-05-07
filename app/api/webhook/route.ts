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
  const sig = req.headers.get('stripe-signature')

  console.log('[webhook] Requête reçue')
  console.log('[webhook] stripe-signature présente:', !!sig)
  console.log('[webhook] STRIPE_WEBHOOK_SECRET défini:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('[webhook] SUPABASE_SERVICE_ROLE_KEY défini:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('[webhook] NEXT_PUBLIC_SUPABASE_URL défini:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!sig) {
    console.error('[webhook] stripe-signature manquante')
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET non défini dans les variables d\'environnement')
    return NextResponse.json({ error: 'Config manquante' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('[webhook] Échec validation signature:', err)
    return NextResponse.json(
      { error: 'Webhook invalide' },
      { status: 400 }
    )
  }

  console.log('[webhook] Événement validé:', event.type, '| id:', event.id)

  const admin = getSupabaseAdmin()

  try {
    // ── checkout.session.completed ────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('[webhook] checkout.session.completed')
      console.log('[webhook] session.id:', session.id)
      console.log('[webhook] session.customer:', session.customer)
      console.log('[webhook] session.subscription:', session.subscription)
      console.log('[webhook] session.metadata:', JSON.stringify(session.metadata))
      console.log('[webhook] session.payment_status:', session.payment_status)

      const { userId, planName, analysesLimit } = session.metadata ?? {}

      if (!userId || !planName || !analysesLimit) {
        console.error('[webhook] ERREUR metadata incomplète — userId:', userId, 'planName:', planName, 'analysesLimit:', analysesLimit)
        return NextResponse.json({ received: true })
      }

      const subscriptionId = session.subscription as string

      if (!subscriptionId) {
        console.error('[webhook] ERREUR session.subscription est null — mode session:', session.mode)
        return NextResponse.json({ received: true })
      }

      const nextReset = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1
      )

      const payload = {
        subscription_status: 'active',
        subscription_plan: planName,
        analyses_limit: parseInt(analysesLimit),
        analyses_used: 0,
        analyses_reset_date: nextReset.toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
      }
      console.log('[webhook] Tentative update Supabase users pour userId:', userId)
      console.log('[webhook] Payload:', JSON.stringify(payload))

      const { data: updateData, error: updateError } = await admin
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select()

      if (updateError) {
        console.error('[webhook] ERREUR Supabase update:', JSON.stringify(updateError))
      } else {
        console.log('[webhook] Supabase update OK — lignes affectées:', JSON.stringify(updateData))
      }

      // Persist plan info in subscription metadata so the
      // customer.subscription.updated handler can read it
      try {
        await stripe.subscriptions.update(subscriptionId, {
          metadata: { planName, analysesLimit },
        })
        console.log('[webhook] Metadata Stripe subscription mise à jour:', subscriptionId)
      } catch (err) {
        console.error('[webhook] Erreur mise à jour metadata subscription Stripe:', err)
      }
    }

    // ── customer.subscription.updated ────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const prev = event.data.previous_attributes as any
      const userId = await getUserId(sub)

      console.log('[webhook] customer.subscription.updated — userId:', userId)

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

      console.log('[webhook] customer.subscription.deleted — customerId:', customerId)

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
        console.log('[webhook] Abonnement annulé pour userId:', userId)
      } else if (customer.email) {
        await admin.from('users').update(update).eq('email', customer.email)
        console.log('[webhook] Abonnement annulé pour email:', customer.email)
      } else {
        console.error(
          '[webhook] Impossible d\'identifier l\'utilisateur pour suppression abonnement — customerId:',
          customerId
        )
      }
    }
  } catch (err) {
    console.error('[webhook] Erreur non gérée dans le handler:', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
