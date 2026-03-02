import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { NextResponse } from 'next/server'
import { sessionOptions, SessionData, defaultSession } from '@/lib/session'
import { createClient } from '@/lib/supabase-server'

export async function getSession() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  
  if (!session.isLoggedIn) {
    return defaultSession
  }
  
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  
  if (!session.isLoggedIn || !session.userId) {
    return null
  }
  
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select()
    .eq('id', session.userId)
    .single()
    
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }
  
  return { user, error: null }
}

export async function requireCreator() {
  const { user, error } = await requireAuth()
  
  if (error) {
    return { user: null, creator: null, error }
  }
  
  const supabase = await createClient()
  const { data: creator } = await supabase
    .from('channels')
    .select()
    .eq('id', user!.id)
    .single()
  
  if (!creator) {
    return { user, creator: null, error: NextResponse.json({ error: 'Creator account not found' }, { status: 404 }) }
  }
  
  return { user, creator, error: null }
}
