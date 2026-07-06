import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubToken } from '@/lib/emailToken'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://alphatradex.ai'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function page(opts: { title: string; text: string; link?: { href: string; label: string } }): NextResponse {
  const link = opts.link
    ? `<a href="${opts.link.href}" style="display:inline-block;margin-top:28px;color:#00E5FF;font-size:14px;font-weight:600;text-decoration:none;">${opts.link.label}</a>`
    : ''
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AlphaTradeX</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;min-height:100vh;">
    <tr>
      <td align="center" style="padding:64px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#12121A;border:1px solid #1E2035;border-radius:12px;">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <div style="color:#F0F4FF;font-size:18px;font-weight:700;letter-spacing:0.04em;margin-bottom:24px;">AlphaTradeX</div>
              <div style="color:#F0F4FF;font-size:22px;font-weight:700;line-height:1.3;">${opts.title}</div>
              <div style="color:#8892AA;font-size:15px;line-height:1.7;margin-top:16px;">${opts.text}</div>
              ${link}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function invalidPage(): NextResponse {
  return page({
    title: 'Lien invalide',
    text: 'Tu dois te connecter à ton espace afin de gérer tes emails.',
    link: { href: `${APP_URL}/dashboard`, label: 'Accéder à mon espace' },
  })
}

async function setOptOut(userId: string, value: boolean) {
  const { error } = await admin().from('users').update({ weekly_email_opt_out: value }).eq('id', userId)
  if (error) {
    console.error('[email/unsubscribe] échec update weekly_email_opt_out — userId:', userId, 'value:', value, JSON.stringify(error))
  }
}

// GET : pages HTML (clic depuis l'email).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = verifyUnsubToken(searchParams.get('token'))
  if (!userId) return invalidPage()

  const action = searchParams.get('action') ?? 'unsubscribe'
  const resubLink = {
    href: `${APP_URL}/api/email/unsubscribe?action=resubscribe&token=${searchParams.get('token')}`,
    label: 'Réactiver le résumé semaine',
  }

  if (action === 'resubscribe') {
    await setOptOut(userId, false)
    return page({
      title: 'Tu viens de te réinscrire',
      text: 'Tu recevras ton résumé semaine par email chaque lundi matin.',
    })
  }

  // Désinscription : distingue le premier opt-out d'un membre déjà désabonné.
  const { data, error } = await admin()
    .from('users')
    .select('weekly_email_opt_out')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('[email/unsubscribe] échec lecture weekly_email_opt_out — userId:', userId, JSON.stringify(error))
  }

  if (data?.weekly_email_opt_out === true) {
    return page({
      title: 'Tu es désabonné',
      text: "Tu as désactivé l'envoi de ton résumé semaine par email chaque lundi matin.",
      link: resubLink,
    })
  }

  await setOptOut(userId, true)
  return page({
    title: 'Tu viens de te désinscrire',
    text: 'Tu ne recevras plus ton résumé semaine par email. Tu peux retrouver ton résumé semaine sur ton espace.',
    link: resubLink,
  })
}

// POST : désinscription un-clic (en-tête List-Unsubscribe-Post de Gmail).
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = verifyUnsubToken(searchParams.get('token'))
  if (!userId) return new NextResponse(null, { status: 400 })
  await setOptOut(userId, true)
  return new NextResponse(null, { status: 200 })
}
