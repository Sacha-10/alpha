import { NextRequest, NextResponse } from 'next/server'

import Stripe from 'stripe'

import { createServerClient } from '@supabase/ssr'

import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

    .single()

  if (dbUserError) {

    console.error('[customer-portal] échec lecture stripe_customer_id — userId:', user.id, JSON.stringify(dbUserError))

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

    const message = err instanceof Error ? err.message : String(err)

    return NextResponse.json({ error: message }, { status: 500 })

  }

}
