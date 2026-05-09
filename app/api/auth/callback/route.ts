import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    let redirectUrl = process.env.NEXT_PUBLIC_APP_URL!

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
      const { data: userData } = await supabase.from('users').select('subscription_status').eq('id', user.id).single()
      redirectUrl = userData?.subscription_status === 'active'
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
