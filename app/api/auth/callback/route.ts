import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { hasActiveAccess } from '@/lib/plans'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    // Collect cookies set by exchangeCodeForSession to apply directly on the redirect response,
    // since NextResponse.redirect() is a separate object and doesn't inherit cookies() mutations.
    const newCookies: { name: string; value: string; options: object }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              newCookies.push({ name, value, options: options ?? {} })
            })
          },
        },
      }
    )

    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      // Échec de l'échange OAuth : pas de session valide. On n'applique PAS les
      // cookies (la redirection ci-dessous ne copie pas newCookies) — même
      // garantie structurelle que le chemin d'erreur de l'insert plus bas.
      console.error(
        '[auth/callback] échec exchangeCodeForSession:',
        JSON.stringify({ message: exchangeError.message, status: exchangeError.status, code: exchangeError.code })
      )
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/?error=account_creation_failed`
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    let redirectUrl = process.env.NEXT_PUBLIC_APP_URL!

    if (user) {
      const profile = {
        email: user.email,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
      }

      // On distingue création et mise à jour : les champs d'abonnement ne sont
      // initialisés qu'à la création d'un nouvel utilisateur. Sur un compte
      // existant, on ne rafraîchit que le profil — jamais subscription_*,
      // sous peine d'écraser un abonnement actif à chaque connexion.
      const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('id', user.id)
        .maybeSingle()
      if (existingError) {
        console.error('[auth/callback] échec lecture ligne users — userId:', user.id, JSON.stringify(existingError))
      }

      let subscriptionStatus: string | null
      if (existing) {
        const { error: updateError } = await supabase.from('users').update(profile).eq('id', user.id)
        if (updateError) {
          console.error('[auth/callback] échec rafraîchissement profil — userId:', user.id, JSON.stringify(updateError))
        }
        subscriptionStatus = existing.subscription_status ?? null
      } else {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          ...profile,
          subscription_plan: null,
          analyses_limit: 0,
          subscription_status: 'inactive',
        })
        if (insertError && insertError.code !== '23505') {
          // Échec de création de la ligne users : sans elle, toutes les routes
          // membres échoueront (compte fantôme). On n'applique PAS les cookies
          // de session et on renvoie vers une URL d'erreur propre.
          console.error('[auth/callback] Erreur création ligne users — userId:', user.id, JSON.stringify(insertError))
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/?error=account_creation_failed`
          )
        }
        // 23505 (doublon) = la ligne existe déjà (re-login ou requêtes
        // concurrentes) : cas légitime, on continue normalement. Une ligne
        // tout juste créée est 'inactive' dans les deux cas.
        subscriptionStatus = 'inactive'
      }

      redirectUrl = hasActiveAccess(subscriptionStatus)
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        : `${process.env.NEXT_PUBLIC_APP_URL}/pricing`
    }

    const response = NextResponse.redirect(redirectUrl)
    newCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
    })
    return response
  }

  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL!)
}
