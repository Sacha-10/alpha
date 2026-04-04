import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from 
  '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createRouteHandlerClient({ 
      cookies 
    })
    await supabase.auth.exchangeCodeForSession(code)
    
    const { data: { user } } = await 
      supabase.auth.getUser()
    
    if (user) {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
        analyses_reset_date: new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          1
        ).toISOString(),
      }, { onConflict: 'id' })
    }
  }
  
  return NextResponse.redirect(
    new URL('/dashboard', req.url)
  )
}
