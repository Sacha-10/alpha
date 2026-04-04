import { createMiddlewareClient } from 
  '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(
    { req, res }
  )
  
  const { data: { session } } = await 
    supabase.auth.getSession()
  
  const protectedRoutes = ['/dashboard']
  const isProtected = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  
  if (isProtected && !session) {
    return NextResponse.redirect(
      new URL('/', req.url)
    )
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
}
