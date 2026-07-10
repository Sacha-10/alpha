import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { hasActiveAccess } from '@/lib/plans'

// Next.js 16 : la convention `middleware` est renommée `proxy`.
// Garde de STATUT centralisée (subscription_status === 'active') :
//  - pages /dashboard/*    → redirection /pricing si non actif ;
//  - routes /api/* sensibles → 401 / 403 JSON si non connecté / non actif.
// Couvre AUTOMATIQUEMENT toute future route /api/* (deny-by-default) : une route
// publique doit être explicitement ajoutée à la liste ci-dessous, sinon elle est
// gardée. Le palier de plan (Premium/Élite) reste vérifié par chaque route via
// requirePlanFor — ici on ne contrôle que le statut.
//
// Routes API PUBLIQUES exclues (auth propre, ou aucune donnée membre lue) :
const PUBLIC_API_PREFIXES = [
  '/api/webhook',          // signature Stripe — JAMAIS bloquer
  '/api/cron',             // CRON_SECRET (Vercel) — JAMAIS bloquer
  '/api/auth',             // callback OAuth — établit la session
  '/api/create-checkout',  // souscription (utilisateur pas encore actif)
  '/api/customer-portal',  // gestion / relance de paiement
  '/api/analyze-demo',     // analyse gratuite publique (landing)
  '/api/email',            // désinscription un-clic (token email, sans session)
  '/api/generate-pdf',     // rend un PDF depuis les données postées (aucune lecture DB)
]

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/')

  // Routes API publiques : aucune vérification (le webhook Stripe et le cron
  // s'authentifient eux-mêmes — on ne touche pas à leur flux).
  if (isApi && isPublicApi(pathname)) {
    return NextResponse.next({ request: req })
  }

  let supabaseResponse = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Non connecté → API : 401 JSON ; page : redirection accueil.
  if (!user) {
    return isApi
      ? NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      : NextResponse.redirect(new URL('/', req.url))
  }

  // Connecté mais sans abonnement actif (résilié, impayé, jamais abonné).
  // maybeSingle : ligne absente → data null (refus légitime), error réservé
  // aux vraies pannes techniques.
  const { data, error } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle()

  // Erreur technique Supabase (panne passagère, timeout) : ne JAMAIS éjecter
  // un abonné actif sur un incident transitoire — on laisse passer. Les routes
  // derrière re-vérifient l'auth et le palier/les limites du plan, PAS
  // subscription_status : fenêtre résiduelle assumée (la résiliation met
  // analyses_limit à 0, donc aucune analyse consommable sur cette fenêtre).
  if (error) {
    console.error(
      '[proxy] Erreur Supabase sur subscription_status — accès laissé passer (les routes re-vérifient auth + palier/limites) :',
      error
    )
    return supabaseResponse
  }

  if (!hasActiveAccess(data?.subscription_status)) {
    return isApi
      ? NextResponse.json({ error: 'Abonnement actif requis', upgrade: true }, { status: 403 })
      : NextResponse.redirect(new URL('/pricing', req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
