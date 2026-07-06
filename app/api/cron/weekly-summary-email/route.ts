import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend } from '@/lib/resend'
import { buildSummaryFromRows } from '@/lib/weeklySummary'
import { isoWeekKey, mondayFromKey, type TradeRow } from '@/lib/weeklyData'
import { getWeeklySummaryEmail } from '@/lib/emails/weeklySummaryEmail'
import { makeUnsubToken } from '@/lib/emailToken'
import { isWeeklyEmailEligible } from '@/lib/plans'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://alphatradex.ai'
const FROM = process.env.RESEND_FROM ?? 'AlphaTradeX <contact@alphatradex.ai>'
const DAY_MS = 24 * 60 * 60 * 1000

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Cron lundi 00:00 UTC — à cet instant la semaine dernière est déjà close,
// aucun délai n'est ajouté.
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const now = new Date()
  const lastWeekKey = isoWeekKey(new Date(mondayFromKey(isoWeekKey(now)).getTime() - 7 * DAY_MS))

  // Membres éligibles : plan premium/elite (casse normalisée), abonnement actif,
  // non opt-out, email présent.
  const { data: members, error } = await admin
    .from('users')
    .select('id, email, subscription_plan, subscription_status, weekly_email_opt_out')

  if (error) {
    console.error('[cron weekly-summary-email] lecture users:', error.message)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  const eligible = (members ?? []).filter(m => {
    if (!isWeeklyEmailEligible(m.subscription_plan, m.subscription_status)) return false
    if (m.weekly_email_opt_out === true) return false
    if (!m.email) return false
    return true
  })

  let sent = 0
  let skipped = 0
  let failed = 0

  // Envoi séquentiel (~600 ms entre deux envois) pour respecter les limites
  // Resend. try/catch par membre : un échec n'arrête pas le lot.
  // NB : maxDuration=60s ⇒ ~100 envois max par exécution. Si le volume de
  // membres premium/elite approche ce seuil, passer à un envoi par lots
  // (pagination + déclenchements multiples) pour éviter le timeout.
  for (const m of eligible) {
    try {
      // Idempotence : ne pas renvoyer si déjà envoyé pour cette semaine.
      const { data: logRow, error: logReadError } = await admin
        .from('weekly_email_log')
        .select('user_id')
        .eq('user_id', m.id)
        .eq('week_key', lastWeekKey)
        .maybeSingle()
      if (logReadError) {
        console.error('[cron weekly-summary-email] échec lecture weekly_email_log — userId:', m.id, 'week_key:', lastWeekKey, JSON.stringify(logReadError))
      }
      if (logRow) {
        skipped++
        continue
      }

      const { data: tradeData, error: tradesError } = await admin
        .from('trades')
        .select('*')
        .eq('user_id', m.id)
      if (tradesError) {
        console.error('[cron weekly-summary-email] échec lecture trades — userId:', m.id, JSON.stringify(tradesError))
      }
      const rows: TradeRow[] = tradeData ?? []

      const summary = buildSummaryFromRows(rows, now)
      // 'none' → pas d'envoi (membre sans trade la semaine dernière).
      if (summary.status !== 'ok') {
        skipped++
        continue
      }

      const token = makeUnsubToken(m.id)
      const unsubscribeUrl = `${APP_URL}/api/email/unsubscribe?token=${token}`
      const { subject, html } = getWeeklySummaryEmail({ summary, appUrl: APP_URL, unsubscribeUrl })

      await resend.emails.send({
        from: FROM,
        to: m.email as string,
        subject,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      const { error: logError } = await admin
        .from('weekly_email_log')
        .insert({ user_id: m.id, week_key: lastWeekKey })
      if (logError) {
        // Email déjà parti : on ne bloque pas le lot, mais sans cette ligne de
        // log l'envoi sera rejoué au prochain run — trace explicite requise.
        console.error('[cron weekly-summary-email] échec insert weekly_email_log — userId:', m.id, 'week_key:', lastWeekKey, JSON.stringify(logError))
      }
      sent++
      await sleep(600)
    } catch (e: any) {
      failed++
      console.error('[cron weekly-summary-email] échec membre', m.id, e?.message)
    }
  }

  console.log(`[cron weekly-summary-email] week=${lastWeekKey} eligible=${eligible.length} sent=${sent} skipped=${skipped} failed=${failed}`)
  return NextResponse.json({ ok: true, weekKey: lastWeekKey, eligible: eligible.length, sent, skipped, failed })
}
