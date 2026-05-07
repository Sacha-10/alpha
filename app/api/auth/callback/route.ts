import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()

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
            })
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    console.log('[auth/callback] exchangeCodeForSession → user.id:', user?.id, 'user.email:', user?.email)

    if (user) {
      const { data: upsertData, error: upsertError } = await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      )
      console.log('[auth/callback] upsert data:', upsertData, 'error:', upsertError)
      if (upsertError) {
        console.log('[auth/callback] upsert error.message:', upsertError.message, 'error.code:', upsertError.code)
      }

      const { data: userData } = await supabase.from('users').select('subscription_status').eq('id', user.id).single()
      if (userData?.subscription_status === 'active') {
        return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL + '/dashboard')
      } else {
        return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL + '/pricing')
      }
    }
  }

  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL!)
}
