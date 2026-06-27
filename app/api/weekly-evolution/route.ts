import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { buildWeeklyData, type TradeRow } from '@/lib/weeklyData'
import { requirePlanFor } from '@/lib/plans'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ── Route ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any
    let user: { id: string } | null = null

    if (token) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
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

    // Palier : Évolution semaine réservée à Premium et au-dessus.
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    if (!requirePlanFor('weeklyEvolution', userData?.subscription_plan)) {
      return NextResponse.json(
        { error: 'Réservé au plan Premium et supérieur.', upgrade: true },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rows: TradeRow[] = data ?? []

    return NextResponse.json(buildWeeklyData(rows))
  } catch (error: any) {
    console.error('[/api/weekly-evolution] Erreur:', error?.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
