import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { PLANS, DISABLED_PLANS } from '@/lib/plans'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Les boutons de plan NAVIGUENT vers cette route (pas de fetch) : toute
// réponse est vue plein écran par l'utilisateur. Succès → 3xx vers Stripe ou
// le dashboard ; échec → JAMAIS de JSON brut, redirection vers /pricing qui
// affiche la carte d'erreur standard (même mécanique que le callback
// d'inscription vers la home).
function checkoutFailed(req: NextRequest) {
  return NextResponse.redirect(new URL('/pricing?error=checkout_failed', req.url))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const planKey = searchParams.get('plan') as keyof typeof PLANS
  const annual = searchParams.get('billing') === 'annual'
  const token = searchParams.get('token')

  // Identité PORTÉE par les requêtes — pas seulement validée. L'ancien client
  // anonyme nu validait le JWT via getUser(token) mais n'attachait AUCUNE
  // identité aux .from() : auth.uid() = NULL sous RLS → la ligne users
  // existante revenait « 0 rows » (PGRST116) et TOUS les clics de plan
  // échouaient. Token (lien des boutons) → Authorization Bearer sur toutes
  // les requêtes ; sinon repli cookies (navigation same-origin) — même
  // pattern que /api/analyses. Backlog connu : passer le flux en cookies
  // seuls et retirer le ?token= de l'URL.
  let supabase: SupabaseClient
  let user: { id: string; email?: string } | null = null

  if (token) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: { user: u }, error } = await supabase.auth.getUser(token)
    if (!u || error) return NextResponse.redirect(new URL('/', req.url))
    user = u
  } else {
    const cookieStore = await cookies()
    supabase = createServerClient(
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
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return NextResponse.redirect(new URL('/', req.url))
    user = u
  }

  if (!user) {
    return NextResponse.redirect(new URL('/', req.url))
  }
  const plan = PLANS[planKey]

  if (!plan) {
    return checkoutFailed(req)
  }

  // Plan désactivé à la vente (cf. DISABLED_PLANS, source unique). Bloque en
  // amont les DEUX chemins (nouvel abonnement ET modification d'abo existant),
  // avant tout appel Stripe. Réactivation = retirer le plan de DISABLED_PLANS.
  if (DISABLED_PLANS.includes(planKey)) {
    return checkoutFailed(req)
  }

  const priceId = annual ? plan.stripePriceAnnual : plan.stripePriceMonthly

  // Vérifier si l'utilisateur a déjà un abonnement actif.
  // maybeSingle (convention maison) : ligne absente → data null, un ÉTAT
  // (pas d'abonnement → branche « nouvel abonnement ») ; error réservé aux
  // vraies pannes techniques.
  const { data: dbUser, error: dbUserError } = await supabase
    .from('users')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  // Sans lecture fiable de l'état d'abonnement, on refuse : traiter une
  // erreur DB comme « pas d'abonnement » créerait un second abonnement.
  if (dbUserError) {
    console.error('create-checkout: échec lecture abonnement existant — userId:', user.id, JSON.stringify(dbUserError))
    return checkoutFailed(req)
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
      return checkoutFailed(req)
    }
  }

  // Nouvel abonnement
  try {
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
  } catch (err) {
    console.error('create-checkout: échec création checkout — userId:', user.id, err)
    return checkoutFailed(req)
  }
}