import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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

    let supabase: SupabaseClient
    let user: { id: string } | null = null

    if (token) {
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      const { data: { user: u }, error } = await supabase.auth.getUser(token)
      if (!u || error) return new NextResponse(null, { status: 401 })
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
      if (!u) return new NextResponse(null, { status: 401 })
      user = u
    }

    if (!user) return new NextResponse(null, { status: 401 })

    // Palier : Évolution semaine réservée à Premium et au-dessus.
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()
    if (userError) {
      console.error('[/api/weekly-evolution] échec lecture users — userId:', user.id, JSON.stringify(userError))
    }

    // Aucun client ne lit le corps de ce 403 (la sidebar verrouille déjà la
    // vue par plan) : statut nu.
    if (!requirePlanFor('weeklyEvolution', userData?.subscription_plan)) {
      return new NextResponse(null, { status: 403 })
    }

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('[/api/weekly-evolution] échec lecture trades — userId:', user.id, JSON.stringify(error))
      return new NextResponse(null, { status: 500 })
    }

    const rows: TradeRow[] = data ?? []

    return NextResponse.json(buildWeeklyData(rows))
  } catch (error: any) {
    console.error('[/api/weekly-evolution] Erreur:', error?.message)
    return new NextResponse(null, { status: 500 })
  }
}
