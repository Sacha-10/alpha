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

    const body = await req.json()
    const { trades } = body
    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'Trades invalides' }, { status: 400 })
    }

    const tradesToInsert = trades.map((trade: any) => ({
      user_id: user.id,
      opened_at: trade.openedAt ?? trade.openTime ?? null,
      closed_at: trade.closedAt ?? trade.closeTime ?? null,
      symbol: trade.symbol ?? null,
      side: trade.side ?? trade.direction ?? null,
      entry: trade.entry ?? trade.entryPrice ?? null,
      exit: trade.exit ?? trade.exitPrice ?? null,
      volume: trade.volume ?? trade.lotSize ?? null,
      profit: trade.profit ?? trade.profitLoss ?? null,
      created_at: new Date().toISOString()
    }))

    const { error } = await supabase.from('trades').insert(tradesToInsert)
    if (error) {
      return NextResponse.json({ error: 'Erreur lors de l\'import.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: tradesToInsert.length })
  } catch (error: any) {
    console.error('[import-trades] Erreur 500:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
