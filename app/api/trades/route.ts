import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRetentionFloor } from '@/lib/plans'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return new NextResponse(null, { status: 401 })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (!user || authError) return new NextResponse(null, { status: 401 })

    // Fenêtre de rétention calculée CÔTÉ SERVEUR depuis le plan réel + la date
    // d'inscription (jamais à partir du dateMin client). Accessible à tous les
    // plans actifs (pas de palier — statut garanti par le proxy).
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_plan, created_at')
      .eq('id', user.id)
      .single()
    if (userError) {
      console.error('[api/trades] échec lecture users — userId:', user.id, JSON.stringify(userError))
    }

    const floor = getRetentionFloor(userData?.subscription_plan, userData?.created_at)

    // Le client peut demander PLUS restreint (dateMin), jamais plus large.
    const clientMin = searchParams.get('dateMin')
    const effectiveMin =
      clientMin && new Date(clientMin) > floor ? new Date(clientMin) : floor

    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .gte('opened_at', effectiveMin.toISOString())
      .order('opened_at', { ascending: true })

    if (error) {
      console.error('[api/trades] échec lecture trades — userId:', user.id, JSON.stringify(error))
      return new NextResponse(null, { status: 500 })
    }

    return NextResponse.json({ trades: data ?? [] })
  } catch (error: any) {
    console.error('[api/trades] Erreur 500:', error)
    return new NextResponse(null, { status: 500 })
  }
}
