import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
)

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
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, planName, analysesLimit } = 
      session.metadata!
    
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
    }).eq('id', userId)
  }
  
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    
    const customer = await stripe.customers.retrieve(
      customerId
    ) as Stripe.Customer
    
    if (customer.email) {
      await admin.from('users').update({
        subscription_status: 'inactive',
        subscription_plan: 'starter',
        analyses_limit: 4,
      }).eq('email', customer.email)
    }
  }
  
  return NextResponse.json({ received: true })
}
