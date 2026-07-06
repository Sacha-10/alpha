import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getRetentionFloor, requirePlanFor } from '@/lib/plans'

export const dynamic = 'force-dynamic'

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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_plan, created_at')
      .eq('id', user.id)
      .single()
    if (userError) {
      console.error('[/api/analyses] échec lecture users — userId:', user.id, JSON.stringify(userError))
    }

    // Palier : Historique des analyses réservé à Premium et au-dessus.
    if (!requirePlanFor('analysesHistory', userData?.subscription_plan)) {
      return NextResponse.json(
        { error: 'Historique réservé au plan Premium et supérieur.', upgrade: true },
        { status: 403 }
      )
    }

    // Fenêtre de rétention serveur : la plus récente de (aujourd'hui − rétention
    // du plan) et (date d'inscription). Élite → depuis l'inscription.
    const floor = getRetentionFloor(userData?.subscription_plan, userData?.created_at)

    const { data, error } = await supabase
      .from('member_analyses')
      .select('id, created_at, plan, report')
      .eq('user_id', user.id)
      .gte('created_at', floor.toISOString())
      .order('created_at', { ascending: false })

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
