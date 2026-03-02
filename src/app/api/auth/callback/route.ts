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
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier,
      clientId: process.env.WHOP_APP_ID!,
      clientSecret: process.env.WHOP_API_KEY!,
      redirectUri: `${baseUrl}/api/auth/callback`,
    })

    const userInfo = await fetchUserInfo(tokens.access_token)
    const supabase = await createClient()
    
    // Sync to Supabase
    // Using a simplistic upsert logic by selecting and then updating/inserting
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('whop_id', userInfo.sub)
      .single()
      
    let userId;

    if (existingUser) {
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
      // Note: We need a UUID for Supabase, if auth.users isn't managing this,
      // we generate one or let the DB default handle it (assuming id is UUID generated)
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(), // Manual uuid generation if supabase auth hook isn't active
          whop_id: userInfo.sub,
          email: userInfo.email || '',
          username: userInfo.preferred_username || '',
          avatar_url: userInfo.picture,
        })
        .select()
        .single()
        
       if(newUser) userId = newUser.id
    }

    const response = NextResponse.redirect(new URL('/', baseUrl))
    
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    session.userId = userId
    session.whopUserId = userInfo.sub
    session.whopAccessToken = tokens.access_token
    session.isLoggedIn = true
    await session.save()

    cookieStore.delete('oauth_code_verifier')
    cookieStore.delete('oauth_state')

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL(`/?error=auth_failed`, baseUrl))
  }
}
