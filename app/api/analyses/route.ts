import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const PLAN_MONTHS: Record<string, number | null> = {
  pro: 1,
  premium: 6,
  elite: null,
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any
    let user: { id: string } | null = null

    if (token) {
      supabase = getSupabase()
      const { data: { user: u }, error } = await supabase.auth.getUser(token)
      if (!u || error) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
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
      if (!u) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      user = u
    }

    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    const plan = userData?.subscription_plan ?? 'pro'
    const months = PLAN_MONTHS[plan] ?? 1

    let query = supabase
      .from('analyses')
      .select('id, created_at, plan, report')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (months !== null) {
      const since = new Date()
      since.setMonth(since.getMonth() - months)
      query = query.gte('created_at', since.toISOString())
    }

    const { data, error } = await query

    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).status === 406) return NextResponse.json({ error: 'Token expiré' }, { status: 401 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ analyses: data ?? [] })
  } catch (error: any) {
    console.error('[/api/analyses] Erreur:', error?.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
