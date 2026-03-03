import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { generatePKCE, generateState, buildAuthorizeUrl } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  const { codeVerifier, codeChallenge } = generatePKCE()
  const state = generateState()
  
  const clientId = process.env.WHOP_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`

  // Get the return URL from query params (set by middleware)
  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/'

  const cookieStore = await cookies()
  cookieStore.set('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })
  cookieStore.set('oauth_return_to', returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  const authorizeUrl = buildAuthorizeUrl({
    clientId,
    redirectUri,
    codeChallenge,
    state,
  })

  return NextResponse.redirect(authorizeUrl)
}
