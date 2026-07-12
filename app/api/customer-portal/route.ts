import { NextRequest, NextResponse } from 'next/server'

import Stripe from 'stripe'

import { createServerClient } from '@supabase/ssr'

import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Le lien « Factures » NAVIGUE vers cette route : toute réponse est vue plein
// écran. Échec → JAMAIS de page blanche ni de JSON, redirection vers la
// surface d'origine (/dashboard, ?view= préservée — portée par le lien) qui
// affiche la carte d'erreur standard. Même mécanique que create-checkout →
// /pricing?error=checkout_failed.
function portalFailed(req: NextRequest) {
  const view = new URL(req.url).searchParams.get('view')
  const url = new URL('/dashboard', req.url)
  if (view) url.searchParams.set('view', view)
  url.searchParams.set('error', 'portal_failed')
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {

  const cookieStore = await cookies()

  const supabase = createServerClient(

    process.env.NEXT_PUBLIC_SUPABASE_URL!,

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    {

      cookies: {

        getAll() { return cookieStore.getAll() },

        setAll(cookiesToSet) {

          try {

            cookiesToSet.forEach(({ name, value, options }) =>

              cookieStore.set(name, value, options)

            )

          } catch {}

        },

      },

    }

  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/', req.url))

  const { data: dbUser, error: dbUserError } = await supabase

    .from('users')

    .select('stripe_customer_id')

    .eq('id', user.id)

    .maybeSingle()

  // maybeSingle (convention maison) : ligne users absente → data null, un ÉTAT
  // (compte sans customer → /pricing via la branche ci-dessous) ; error réservé
  // aux vraies pannes techniques — carte d'erreur sur le dashboard, à ne pas
  // confondre avec « pas de customer » (qui enverrait un abonné vers /pricing).
  if (dbUserError) {

    console.error('[customer-portal] échec lecture stripe_customer_id — userId:', user.id, JSON.stringify(dbUserError))

    return portalFailed(req)

  }

  if (!dbUser?.stripe_customer_id) {

    return NextResponse.redirect(new URL('/pricing', req.url))

  }

  try {

    const session = await stripe.billingPortal.sessions.create({

      customer: dbUser.stripe_customer_id,

      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,

    })

    return NextResponse.redirect(session.url)

  } catch (err) {

    console.error('[customer-portal] échec création session portail — userId:', user.id, err)

    return portalFailed(req)

  }

}
