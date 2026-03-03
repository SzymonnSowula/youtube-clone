import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSession } from '@/lib/auth'

// POST /api/comments/[id]/like — Toggle like on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const commentId = params.id
  const supabase = await createClient()

  // Check if already liked
  const { data: existing } = await supabase
    .from('comment_likes')
    .select()
    .eq('user_id', session.userId)
    .eq('comment_id', commentId)
    .single()

  if (existing) {
    // Unlike
    await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', session.userId)
      .eq('comment_id', commentId)
    
    return NextResponse.json({ liked: false })
  } else {
    // Like
    await supabase
      .from('comment_likes')
      .insert({ user_id: session.userId, comment_id: commentId })
    
    return NextResponse.json({ liked: true })
  }
}
