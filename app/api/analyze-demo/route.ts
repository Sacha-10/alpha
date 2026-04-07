import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeTrades } from '@/lib/openai'
import type { Trade } from '@/lib/parseCSV'

export const maxDuration = 60

function randInt(min: number, max: number): number {
  return Math.round(Math.random() * (max - min) + min)
}

function randFloat(
  min: number,
  max: number,
  decimals: number
): number {
  const val = Math.random() * (max - min) + min
  return parseFloat(val.toFixed(decimals))
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
    const targets = {
      winRate: randInt(47, 57),
      pnl: -randInt(250, 1000),
      drawdown: randFloat(7, 15, 1),
      profitFactor: randFloat(0.7, 1.4, 2),
      sharpe: randFloat(-0.2, 0.5, 2),
      riskReward: randFloat(0.7, 1.5, 2),
      londonWinRate: randInt(55, 70),
      newYorkWinRate: randInt(40, 55),
      tokyoWinRate: randInt(25, 40),
      psychoScore: randInt(27, 55),
      propFirmScore: randInt(25, 45),
      riskScore: randInt(30, 50),
    }
    while (
      Math.abs(targets.psychoScore - targets.propFirmScore) < 7 ||
      Math.abs(targets.psychoScore - targets.riskScore) < 7 ||
      Math.abs(targets.propFirmScore - targets.riskScore) < 7
    ) {
      targets.psychoScore = randInt(35, 55)
      targets.propFirmScore = randInt(25, 45)
      targets.riskScore = randInt(30, 50)
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
