import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { createClient } from './lib/supabase-server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Refresh iron-session if needed (though iron-session is usually managed in API/Server actions)
  // But we can check it here for protection
  const session = await getIronSession<SessionData>(
    request.cookies as any,
    sessionOptions
  )

  const isProtected = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/creator')

  if (isProtected && !session.isLoggedIn) {
     return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }

  // Also refresh the Supabase session
  const supabase = await createClient()
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
