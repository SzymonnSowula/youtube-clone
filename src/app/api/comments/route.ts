import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSession } from '@/lib/auth'

// GET /api/comments?videoId=xxx — Fetch all comments for a video
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get('videoId')
  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch top-level comments with user info
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*, users(id, username, avatar_url)')
    .eq('video_id', videoId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch replies for each comment
  const commentIds = comments.map((c: any) => c.id)
  
  let replies: any[] = []
  if (commentIds.length > 0) {
    const { data: replyData } = await supabase
      .from('comments')
      .select('*, users(id, username, avatar_url)')
      .in('parent_id', commentIds)
      .order('created_at', { ascending: true })
    
    replies = replyData || []
  }

  // Fetch like counts for all comments
  const allIds = [...commentIds, ...replies.map((r: any) => r.id)]
  let likeCounts: Record<string, number> = {}
  
  if (allIds.length > 0) {
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', allIds)
    
    if (likes) {
      for (const like of likes) {
        likeCounts[like.comment_id] = (likeCounts[like.comment_id] || 0) + 1
      }
    }
  }

  // Check which comments the current user has liked
  const session = await getSession()
  let userLikedComments: string[] = []
  
  if (session.isLoggedIn && session.userId && allIds.length > 0) {
    const { data: userLikes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', session.userId)
      .in('comment_id', allIds)
    
    userLikedComments = (userLikes || []).map((l: any) => l.comment_id)
  }

  // Assemble the response
  const commentsWithReplies = comments.map((comment: any) => ({
    ...comment,
    likeCount: likeCounts[comment.id] || 0,
    isLiked: userLikedComments.includes(comment.id),
    replies: replies
      .filter((r: any) => r.parent_id === comment.id)
      .map((r: any) => ({
        ...r,
        likeCount: likeCounts[r.id] || 0,
        isLiked: userLikedComments.includes(r.id),
      })),
  }))

  return NextResponse.json({ comments: commentsWithReplies })
}

// POST /api/comments — Add a comment or reply
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { videoId, content, parentId } = body

  if (!videoId || !content?.trim()) {
    return NextResponse.json({ error: 'videoId and content required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      video_id: videoId,
      user_id: session.userId,
      parent_id: parentId || null,
      content: content.trim(),
    })
    .select('*, users(id, username, avatar_url)')
    .single()

  if (error) {
    console.error('Comment insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: { ...comment, likeCount: 0, isLiked: false, replies: [] } })
}
