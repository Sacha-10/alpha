import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { APP_LAUNCH } from '@/lib/plans'
import { computeSourceId } from '@/lib/parseCSV/sourceId'

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

    // Date d'inscription : repli sur APP_LAUNCH si jamais absente.
    const { data: userData } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', user.id)
      .single()
    const registered = userData?.created_at ? new Date(userData.created_at) : APP_LAUNCH

    const mapped = trades.map((trade: any) => ({
      user_id: user.id,
      opened_at: trade.openedAt ?? trade.openTime ?? null,
      closed_at: trade.closedAt ?? trade.closeTime ?? null,
      symbol: trade.symbol ?? null,
      side: trade.side ?? trade.direction ?? null,
      entry: trade.entry ?? trade.entryPrice ?? null,
      exit: trade.exit ?? trade.exitPrice ?? null,
      volume: trade.volume ?? trade.lotSize ?? null,
      profit: trade.profit ?? trade.profitLoss ?? null,
      // Clé de dédup (avec user_id) : format détecté + identifiant source.
      source: trade.source ?? null,
      source_id: computeSourceId(trade),
      created_at: new Date().toISOString()
    }))

    // Filtre de STOCKAGE : les trades antérieurs à l'inscription ne seraient
    // jamais visibles (cf. rétention) → on ne les stocke pas. On ne filtre
    // jamais les trades postérieurs à l'inscription, ni ceux sans date.
    const tradesToInsert = mapped.filter(
      (t) => !t.opened_at || new Date(t.opened_at) >= registered
    )
    const skipped = mapped.length - tradesToInsert.length

    // Upsert avec dédup : les trades déjà présents (même user_id, source,
    // source_id) sont IGNORÉS silencieusement (ON CONFLICT DO NOTHING) au lieu
    // de créer un doublon ou de lever une erreur. Le .select() ne renvoie que
    // les lignes RÉELLEMENT insérées → on en déduit le nombre de doublons.
    let inserted = 0
    if (tradesToInsert.length > 0) {
      const { data: insertedRows, error } = await supabase
        .from('trades')
        .upsert(tradesToInsert, {
          onConflict: 'user_id,source,source_id',
          ignoreDuplicates: true,
        })
        .select('id')
      if (error) {
        return NextResponse.json({ error: 'Erreur lors de l\'import.' }, { status: 500 })
      }
      inserted = insertedRows?.length ?? 0
    }

    // Deux raisons distinctes d'écarter un trade :
    //  - skipped    : antérieur à la date d'inscription (rétention) ;
    //  - duplicates : déjà présent en base (même clé de dédup).
    const duplicates = tradesToInsert.length - inserted

    return NextResponse.json({ success: true, count: inserted, skipped, duplicates })
  } catch (error: any) {
    console.error('[import-trades] Erreur 500:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
