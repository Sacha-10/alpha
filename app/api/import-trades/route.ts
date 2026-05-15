import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const maxDuration = 60

export async function POST(req: NextRequest) {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { trades } = await req.json()
    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'Trades invalides' }, { status: 400 })
    }

    const tradesToInsert = trades.map((trade: any) => ({
      user_id: user.id,
      opened_at: trade.openedAt ? new Date(trade.openedAt).toISOString() : null,
      closed_at: trade.closedAt ? new Date(trade.closedAt).toISOString() : null,
      symbol: trade.symbol ?? null,
      side: trade.side ?? null,
      entry: trade.entry ?? null,
      exit: trade.exit ?? null,
      volume: trade.volume ?? null,
      profit: trade.profit ?? null,
      created_at: new Date().toISOString()
    }))

    const { error } = await supabase.from('trades').insert(tradesToInsert)
    if (error) {
      console.error('[import-trades] Erreur insert:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'import.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: tradesToInsert.length })
  } catch (error: any) {
    console.error('[import-trades] Erreur 500:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
