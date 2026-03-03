import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isProtected = 
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/creator')

  if (isProtected) {
    // Check for the iron-session cookie existence
    const sessionCookie = request.cookies.get('youtube-clone-session')
    
    if (!sessionCookie?.value) {
      // Pass the intended destination as a query param
      const loginUrl = new URL('/api/auth/login', request.url)
      loginUrl.searchParams.set('returnTo', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
