import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSession } from '@/lib/auth'

// POST /api/videos/[id]/like — Toggle like/dislike on a video
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { id: videoId } = await params
  const body = await request.json()
  const type = body.type // 'like' or 'dislike'

  if (!type || !['like', 'dislike'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check if already voted
  const { data: existing } = await supabase
    .from('video_likes')
    .select()
    .eq('user_id', session.userId)
    .eq('video_id', videoId)
    .single()

  if (existing) {
    if (existing.type === type) {
      // Remove vote (toggle off)
      await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', session.userId)
        .eq('video_id', videoId)
      
      return NextResponse.json({ action: 'removed', type: null })
    } else {
      // Switch vote
      await supabase
        .from('video_likes')
        .update({ type })
        .eq('user_id', session.userId)
        .eq('video_id', videoId)
      
      return NextResponse.json({ action: 'switched', type })
    }
  } else {
    // New vote
    await supabase
      .from('video_likes')
      .insert({ user_id: session.userId, video_id: videoId, type })
    
    return NextResponse.json({ action: 'added', type })
  }
}

// GET /api/videos/[id]/like — Get like/dislike counts and user's vote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: videoId } = await params
  const supabase = await createClient()

  const { data: likes } = await supabase
    .from('video_likes')
    .select('type')
    .eq('video_id', videoId)

  const likeCount = (likes || []).filter((l: any) => l.type === 'like').length
  const dislikeCount = (likes || []).filter((l: any) => l.type === 'dislike').length

  // Check user's vote
  const session = await getSession()
  let userVote: string | null = null

  if (session.isLoggedIn && session.userId) {
    const { data: userLike } = await supabase
      .from('video_likes')
      .select('type')
      .eq('user_id', session.userId)
      .eq('video_id', videoId)
      .single()
    
    userVote = userLike?.type || null
  }

  return NextResponse.json({ likeCount, dislikeCount, userVote })
}
