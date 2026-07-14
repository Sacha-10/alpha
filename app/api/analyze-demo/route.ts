import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeTradesDemo } from '@/lib/openai'
import type { Trade } from '@/lib/parseCSV'

// 2 tentatives × 70s mesurés + marge ; les routes sans retry gardent leur limite (décision propriétaire)
export const maxDuration = 150

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('[analyze-demo] Variables manquantes:', {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(url),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(serviceKey),
    })
    return new NextResponse(null, { status: 500 })
  }

  let supabase
  try {
    supabase = createClient(url, serviceKey)
  } catch (err) {
    console.error('[analyze-demo] Échec étape: createClient Supabase', err)
    return new NextResponse(null, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch (err) {
    console.error('[analyze-demo] Échec étape: parse JSON body', err)
    return new NextResponse(null, { status: 400 })
  }

  let trades: Trade[]
  try {
    const raw = (body as { trades?: unknown })?.trades
    if (!Array.isArray(raw)) {
      return new NextResponse(null, { status: 400 })
    }
    trades = raw as Trade[]
  } catch (err) {
    console.error('[analyze-demo] Échec étape: validation trades (exception)', err)
    return new NextResponse(null, { status: 400 })
  }

  const rawForwarded = req.headers.get('x-forwarded-for')
  const ip =
    rawForwarded?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  // Check anti-abus : FAIL-OPEN. Un échec technique du select ne bloque plus
  // le visiteur (console.error + on continue comme si l'IP était inconnue) —
  // tout vrai problème remontera par le chemin d'erreur unique au clic
  // (échec OpenAI ou insert). L'insert reste la barrière anti-abus.
  let existing: { ip_address: string } | null = null
  try {
    const { data, error: selectError } = await supabase
      .from('visitor_analyses')
      .select('ip_address')
      .eq('ip_address', ip)
      .maybeSingle()

    if (selectError) {
      console.error(
        '[analyze-demo] Échec étape: supabase select visitor_analyses (erreur API) — fail-open',
        {
          code: selectError.code,
          message: selectError.message,
          details: selectError.details,
          hint: selectError.hint,
          ip,
        }
      )
    } else {
      existing = data
    }
  } catch (err) {
    console.error('[analyze-demo] Échec étape: supabase select visitor_analyses (exception) — fail-open', err)
  }

  if (existing) {
    // IP déjà marquée : mur. Pas de re-livraison — l'accès au rapport déjà
    // produit passe par le bouton « Mon analyse » (session courante, côté
    // client). OpenAI n'est JAMAIS rappelé pour une IP marquée.
    return new NextResponse(null, { status: 429 })
  }

  let report: unknown
  try {
    const targetBestSymbolWinRate = randInt(62, 72)
    const targetWorstSymbolWinRate = randInt(22, 32)

    // EURUSD ne se situe jamais sur le meilleur
    // ET le pire symbole en même temps
    const bestSymbolRoll = Math.random()
    const targetBestSymbol = bestSymbolRoll > 0.5 ? 'XAUUSD' : 'EURUSD'

    const worstSymbolRoll = Math.random()
    const targetWorstSymbol = worstSymbolRoll > 0.5 ? 'EURUSD' : 'BTCUSD'

    // Alternance égale meilleur/pire jour
    const targetBestDay = Math.random() > 0.5
      ? 'Mardi' : 'Jeudi'
    const targetWorstDay = Math.random() > 0.5
      ? 'Lundi' : 'Vendredi'

    // Heures toujours sur plage 07h-22h par tranches de 2h
    const hours = [
      '07:00-09:00', '09:00-11:00', '11:00-13:00',
      '13:00-15:00', '15:00-17:00', '17:00-19:00',
      '20:00-22:00'
    ]
    const bestHourIndex = Math.floor(
      Math.random() * hours.length)
    let worstHourIndex
    do {
      worstHourIndex = Math.floor(
        Math.random() * hours.length)
    } while (
      Math.abs(worstHourIndex - bestHourIndex) < 2
    )
    const targetBestHour = hours[bestHourIndex]
    const targetWorstHour = hours[worstHourIndex]

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
      psychoScore: randInt(50, 65),
      riskScore: randInt(35, 50),
      propFirmScore: randInt(20, 35),
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
      Math.abs(targets.psychoScore - targets.riskScore) < 7 ||
      Math.abs(targets.psychoScore - targets.propFirmScore) < 7 ||
      Math.abs(targets.riskScore - targets.propFirmScore) < 7
    ) {
      targets.psychoScore = randInt(50, 65)
      targets.riskScore = randInt(35, 50)
      targets.propFirmScore = randInt(20, 35)
    }
    while (
      Math.abs(targets.londonWinRate - targets.newYorkWinRate) < 7 ||
      Math.abs(targets.londonWinRate - targets.tokyoWinRate) < 7 ||
      Math.abs(targets.newYorkWinRate - targets.tokyoWinRate) < 7
    ) {
      targets.londonWinRate = randInt(55, 70)
      targets.newYorkWinRate = randInt(40, 55)
      targets.tokyoWinRate = randInt(25, 40)
    }

    const shuffled = [...trades]
      .sort(() => Math.random() - 0.5)
      .slice(0, 120)
    report = await analyzeTradesDemo(shuffled, targets)
  } catch (err) {
    console.error('[analyze-demo] Échec étape: OpenAI analyzeTrades', err)
    return new NextResponse(null, { status: 500 })
  }

  // L'IP n'est brûlée qu'APRÈS le succès de l'analyse OpenAI : un échec
  // d'analyse ne consomme pas la démo du visiteur. L'insert doit réussir
  // AVANT de rendre le rapport — sinon 500 (le visiteur pourra réessayer,
  // aucun rapport rendu sans IP enregistrée). L'insert est la barrière
  // anti-abus.
  try {
    const { error: insertError } = await supabase
      .from('visitor_analyses')
      .insert({ ip_address: ip, used_at: new Date().toISOString() })

    if (insertError) {
      // 23505 (IP déjà marquée — check fail-open passé pendant une panne, ou
      // requêtes concurrentes) : le visiteur a déjà consommé sa démo → mur,
      // pas de re-livraison.
      if (insertError.code === '23505') {
        return new NextResponse(null, { status: 429 })
      }
      console.error(
        '[analyze-demo] Échec étape: supabase insert visitor_analyses (erreur API)',
        {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          ip,
        }
      )
      return new NextResponse(null, { status: 500 })
    }
  } catch (err) {
    console.error('[analyze-demo] Échec étape: supabase insert visitor_analyses (exception)', err)
    return new NextResponse(null, { status: 500 })
  }

  try {
    return NextResponse.json(report)
  } catch (err) {
    console.error('[analyze-demo] Échec étape: NextResponse.json(report)', err)
    return new NextResponse(null, { status: 500 })
  }
}
