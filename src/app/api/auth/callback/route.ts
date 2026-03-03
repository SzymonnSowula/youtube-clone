import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { exchangeCodeForTokens, fetchUserInfo } from '@/lib/oauth'
import { sessionOptions, SessionData } from '@/lib/session'
import { createClient } from '@/lib/supabase-server'

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

    // Step 3: Sync user to Supabase
    console.log('[Auth] Syncing user to Supabase...')
    const supabase = await createClient()
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('whop_id', userInfo.sub)
      .single()
      
    let userId: string;

    if (existingUser) {
      console.log('[Auth] Existing user found, updating...')
      await supabase
        .from('users')
        .update({
          email: userInfo.email || '',
          username: userInfo.preferred_username || '',
          avatar_url: userInfo.picture,
        })
        .eq('whop_id', userInfo.sub)
        
      userId = existingUser.id;
    } else {
      console.log('[Auth] No existing user, creating new one...')
      const newId = crypto.randomUUID()
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: newId,
          whop_id: userInfo.sub,
          email: userInfo.email || '',
          username: userInfo.preferred_username || '',
          avatar_url: userInfo.picture,
        })
        .select()
        .single()
        
      if (insertError) {
        console.error('[Auth] Supabase insert error:', insertError)
        userId = newId
      } else {
        userId = newUser!.id
      }
    }

    console.log('[Auth] Creating session for userId:', userId)

    // Step 4: Save session
    const response = NextResponse.redirect(new URL('/', baseUrl))
    
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.userId = userId
    session.whopUserId = userInfo.sub
    session.whopAccessToken = tokens.access_token
    session.isLoggedIn = true
    await session.save()

    // Clean up
    cookieStore.delete('oauth_code_verifier')
    cookieStore.delete('oauth_state')

    console.log('[Auth] Login complete, redirecting to home')
    return response
  } catch (err) {
    console.error('[Auth] OAuth callback error:', err)
    const errorMessage = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(new URL(`/?error=auth_failed&detail=${encodeURIComponent(errorMessage.substring(0, 200))}`, baseUrl))
  }
}
