import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createRouteHandlerClient } from 
  '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
)

const PLANS: Record<string, {
  monthly: number,
  annual: number,
  name: string,
  limit: number
}> = {
  starter: {
    monthly: 2900,
    annual: 2300,
    name: 'Starter — 1 analyse par semaine',
    limit: 4,
  },
  pro: {
    monthly: 7900,
    annual: 6300,
    name: 'Pro — 1 analyse par jour ouvré',
    limit: 24,
  },
  elite: {
    monthly: 19900,
    annual: 15900,
    name: 'Elite — Analyses illimitées',
    limit: 999999,
  },
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ 
    cookies 
  })
  const { data: { user } } = await 
    supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  const { searchParams } = new URL(req.url)
  const planKey = searchParams.get('plan') || 'starter'
  const annual = searchParams.get('billing') === 'annual'
  const plan = PLANS[planKey]
  
  if (!plan) {
    return NextResponse.json(
      { error: 'Plan invalide' },
      { status: 400 }
    )
  }
  
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { userId: user.id },
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    payment_method_types: ['card'],
    currency: 'eur',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: plan.name },
        unit_amount: annual 
          ? plan.annual 
          : plan.monthly,
        recurring: { 
          interval: annual ? 'year' : 'month' 
        },
      },
      quantity: 1,
    }],
    metadata: {
      userId: user.id,
      planName: planKey,
      analysesLimit: plan.limit.toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#tarifs`,
  })
  
  return NextResponse.redirect(session.url!)
}
