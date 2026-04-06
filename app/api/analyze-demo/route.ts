import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeTrades } from '@/lib/openai'
import type { Trade } from '@/lib/parseCSV'

export async function POST(req: NextRequest) {
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

  const supabase = createClient(url, serviceKey)

  let body: unknown
  try {
    body = await req.json()
  } catch (parseErr) {
    console.error('[analyze-demo] Corps JSON invalide:', parseErr)
    return NextResponse.json(
      { error: 'Requête invalide.' },
      { status: 400 }
    )
  }

  const trades = (body as { trades?: unknown })?.trades
  if (!Array.isArray(trades)) {
    console.error('[analyze-demo] Champ trades absent ou non-tableau:', {
      type: typeof trades,
    })
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

  try {
    const { data: existing, error: selectError } = await supabase
      .from('demo_usage')
      .select('ip_address')
      .eq('ip_address', ip)
      .maybeSingle()

    if (selectError) {
      console.error('[analyze-demo] Supabase select demo_usage:', {
        code: selectError.code,
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
        ip,
      })
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

    const { error: insertError } = await supabase
      .from('demo_usage')
      .insert({ ip_address: ip, used_at: new Date().toISOString() })

    if (insertError) {
      console.error('[analyze-demo] Supabase insert demo_usage:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        ip,
      })
      return NextResponse.json(
        { error: 'Erreur lors de l’enregistrement démo.' },
        { status: 500 }
      )
    }

    const report = await analyzeTrades(trades as Trade[])
    return NextResponse.json(report)
  } catch (err) {
    console.error('[analyze-demo] Échec analyse (OpenAI ou autre):', err)
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
}
