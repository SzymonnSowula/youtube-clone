import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { exchangeCodeForTokens, fetchUserInfo } from '@/lib/oauth'
import { sessionOptions, SessionData } from '@/lib/session'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, baseUrl))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', baseUrl))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value
  const returnTo = cookieStore.get('oauth_return_to')?.value || '/'

  if (!storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=invalid_state', baseUrl))
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL('/?error=missing_verifier', baseUrl))
  }

  try {
    // Step 1: Exchange code for tokens
    console.log('[Auth] Exchanging code for tokens...')
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier,
      clientId: process.env.WHOP_APP_ID!,
      clientSecret: process.env.WHOP_API_KEY!,
      redirectUri: `${baseUrl}/api/auth/callback`,
    })
    console.log('[Auth] Token exchange successful')

    // Step 2: Fetch user info
    console.log('[Auth] Fetching user info...')
    const userInfo = await fetchUserInfo(tokens.access_token)
    console.log('[Auth] User info received:', userInfo.sub, userInfo.preferred_username)

    // Step 3: Sync user to Supabase (using service role to bypass RLS)
    console.log('[Auth] Syncing user to Supabase...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    // Upsert user (create if new, update if returning)
    const { data: user, error: upsertError } = await supabase
      .from('users')
      .upsert({
        whop_id: userInfo.sub,
        email: userInfo.email || '',
        username: userInfo.preferred_username || '',
        avatar_url: userInfo.picture,
      }, { onConflict: 'whop_id' })
      .select('id')
      .single()

    if (upsertError) {
      console.error('[Auth] Supabase upsert error:', upsertError)
    }

    const userId = user?.id || crypto.randomUUID()

    console.log('[Auth] Creating session for userId:', userId)

    // Step 4: Create redirect response and attach session cookie directly to it
    const redirectUrl = new URL(returnTo, baseUrl)
    const response = NextResponse.redirect(redirectUrl)

    // Set the iron-session cookie directly on the response
    const session = await getIronSession<SessionData>(request, response, sessionOptions)
    session.userId = userId
    session.whopUserId = userInfo.sub
    session.whopAccessToken = tokens.access_token
    session.isLoggedIn = true
    await session.save()

    // Clean up OAuth cookies
    response.cookies.delete('oauth_code_verifier')
    response.cookies.delete('oauth_state')
    response.cookies.delete('oauth_return_to')

    console.log('[Auth] Login complete, redirecting to', returnTo)
    return response
  } catch (err) {
    console.error('[Auth] OAuth callback error:', err)
    const errorMessage = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(new URL(`/?error=auth_failed&detail=${encodeURIComponent(errorMessage.substring(0, 200))}`, baseUrl))
  }
}
