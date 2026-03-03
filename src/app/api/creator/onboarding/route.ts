import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { channelName, description } = await request.json()

  if (!channelName || typeof channelName !== 'string' || channelName.trim().length === 0) {
    return NextResponse.json({ error: 'Channel name is required' }, { status: 400 })
  }

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Check if user already has a channel
  const { data: existing } = await supabase
    .from('channels')
    .select('id')
    .eq('id', session.userId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You already have a channel' }, { status: 409 })
  }

  // Check if channel name is taken
  const { data: nameTaken } = await supabase
    .from('channels')
    .select('id')
    .eq('channel_name', channelName.trim())
    .single()

  if (nameTaken) {
    return NextResponse.json({ error: 'Channel name is already taken' }, { status: 409 })
  }

  // Create the channel
  const { data: channel, error } = await supabase
    .from('channels')
    .insert({
      id: session.userId,
      channel_name: channelName.trim(),
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[Onboarding] Error creating channel:', error)
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
  }

  return NextResponse.json({ channel })
}
