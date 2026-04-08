import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeTrades } from '@/lib/openai'
import type { Trade } from '@/lib/parseCSV'

export const maxDuration = 60

function randInt(min: number, max: number): number {
  return Math.min(max, Math.max(min,
    Math.round(Math.random() * (max - min) + min)))
}

function randFloat(
  min: number,
  max: number,
  decimals: number
): number {
  const val = Math.random() * (max - min) + min
  return Math.min(max, Math.max(min, parseFloat(val.toFixed(decimals))))
}

export async function POST(req: NextRequest) {
  console.log('[analyze-demo] Route appelée')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('[analyze-demo] Variables manquantes:', {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey),
    })
    return NextResponse.json(
      { error: 'Configuration serveur incomplète.' },
      { status: 500 }
    )
  }

  let supabase
  try {
    supabase = createClient(url, serviceKey)
  } catch (err) {
    console.error('[analyze-demo] Échec étape: createClient Supabase', err)
    return NextResponse.json(
      { error: 'Erreur client base de données.' },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch (err) {
    console.error('[analyze-demo] Échec étape: parse JSON body', err)
    return NextResponse.json(
      { error: 'Requête invalide.' },
      { status: 400 }
    )
  }

  let trades: Trade[]
  try {
    const raw = (body as { trades?: unknown })?.trades
    if (!Array.isArray(raw)) {
      console.error('[analyze-demo] Échec étape: validation trades (type)', {
        type: typeof raw,
      })
      return NextResponse.json(
        { error: 'Données trades invalides.' },
        { status: 400 }
      )
    }
    trades = raw as Trade[]
  } catch (err) {
    console.error('[analyze-demo] Échec étape: validation trades (exception)', err)
    return NextResponse.json(
      { error: 'Données trades invalides.' },
      { status: 400 }
    )
  }

  const rawForwarded = req.headers.get('x-forwarded-for')
  const ip =
    rawForwarded?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  let existing: { ip_address: string } | null
  try {
    const { data, error: selectError } = await supabase
      .from('demo_usage')
      .select('ip_address')
      .eq('ip_address', ip)
      .maybeSingle()

    if (selectError) {
      console.error(
        '[analyze-demo] Échec étape: supabase select demo_usage (erreur API)',
        {
          code: selectError.code,
          message: selectError.message,
          details: selectError.details,
          hint: selectError.hint,
          ip,
        }
      )
      return NextResponse.json(
        { error: 'Erreur lors de la vérification démo.' },
        { status: 500 }
      )
    }
    existing = data
  } catch (err) {
    console.error('[analyze-demo] Échec étape: supabase select demo_usage (exception)', err)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification démo.' },
      { status: 500 }
    )
  }

  if (existing) {
    return NextResponse.json(
      {
        error:
          'Vous avez déjà utilisé votre analyse ' +
          'démo. Créez un compte pour analyser vos ' +
          'propres trades.',
      },
      { status: 429 }
    )
  }

  try {
    const { error: insertError } = await supabase
      .from('demo_usage')
      .insert({ ip_address: ip, used_at: new Date().toISOString() })

    if (insertError) {
      console.error(
        '[analyze-demo] Échec étape: supabase insert demo_usage (erreur API)',
        {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          ip,
        }
      )
      return NextResponse.json(
        { error: 'Erreur lors de l’enregistrement démo.' },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('[analyze-demo] Échec étape: supabase insert demo_usage (exception)', err)
    return NextResponse.json(
      { error: 'Erreur lors de l’enregistrement démo.' },
      { status: 500 }
    )
  }

  let report: unknown
  try {
    const targetBestSymbolWinRate = randInt(62, 72)
    const targetWorstSymbolWinRate = randInt(22, 32)

    // Alternance égale meilleur/pire symbole
    // EURUSD ne peut pas être meilleur ET pire
    const symbolRoll = Math.random()
    const targetBestSymbol = symbolRoll > 0.5
      ? 'XAUUSD' : 'EURUSD'
    const targetWorstSymbol = targetBestSymbol === 'EURUSD'
      ? 'BTCUSD'
      : (Math.random() > 0.5 ? 'BTCUSD' : 'EURUSD')

    // Alternance égale meilleur/pire jour
    const targetBestDay = Math.random() > 0.5
      ? 'Mardi' : 'Jeudi'
    const targetWorstDay = Math.random() > 0.5
      ? 'Lundi' : 'Vendredi'

    // Heures toujours sur plage 07h-22h par tranches de 2h
    const hours = [
      '07:00-09:00', '08:00-10:00', '09:00-11:00',
      '10:00-12:00', '11:00-13:00', '12:00-14:00',
      '13:00-15:00', '14:00-16:00', '15:00-17:00',
      '16:00-18:00', '17:00-19:00', '18:00-20:00',
      '19:00-21:00', '20:00-22:00'
    ]
    const targetBestHour = hours[
      Math.floor(Math.random() * hours.length)]
    let targetWorstHour
    do {
      targetWorstHour = hours[
        Math.floor(Math.random() * hours.length)]
    } while (targetWorstHour === targetBestHour)

    const targets = {
      winRate: randInt(45, 65),
      pnl: -randInt(250, 1000),
      drawdown: randFloat(7, 15, 1),
      profitFactor: randFloat(0.7, 1.4, 2),
      sharpe: randFloat(-0.2, 0.5, 2),
      riskReward: randFloat(0.7, 1.5, 2),
      londonWinRate: randInt(55, 70),
      newYorkWinRate: randInt(40, 55),
      tokyoWinRate: randInt(25, 40),
      psychoScore: randInt(45, 65),
      propFirmScore: randInt(25, 45),
      riskScore: randInt(35, 55),
      targetBestSymbolWinRate,
      targetWorstSymbolWinRate,
      targetBestSymbol,
      targetWorstSymbol,
      targetBestDay,
      targetWorstDay,
      targetBestHour,
      targetWorstHour,
    }
    while (
      Math.abs(targets.psychoScore - targets.propFirmScore) < 7 ||
      Math.abs(targets.psychoScore - targets.riskScore) < 7 ||
      Math.abs(targets.propFirmScore - targets.riskScore) < 7
    ) {
      targets.psychoScore = randInt(45, 65)
      targets.propFirmScore = randInt(25, 45)
      targets.riskScore = randInt(35, 55)
    }

    const shuffled = [...trades]
      .sort(() => Math.random() - 0.5)
      .slice(0, 120)
    report = await analyzeTrades(shuffled, targets)
  } catch (err) {
    console.error('[analyze-demo] Échec étape: OpenAI analyzeTrades', err)
    const message =
      err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        error:
          message ||
          'Erreur lors de l’analyse. Réessayez plus tard.',
      },
      { status: 500 }
    )
  }

  try {
    return NextResponse.json(report)
  } catch (err) {
    console.error('[analyze-demo] Échec étape: NextResponse.json(report)', err)
    return NextResponse.json(
      { error: 'Erreur lors de la construction de la réponse.' },
      { status: 500 }
    )
  }
}
