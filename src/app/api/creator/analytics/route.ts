import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSession } from '@/lib/auth'
import { whop } from '@/lib/whop'

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch the channel for this user
  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', session.userId)
    .single()

  if (!channel) {
    return NextResponse.json({ error: 'No channel found' }, { status: 404 })
  }

  // --- Supabase Stats ---
  
  // Total videos
  const { count: videoCount } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channel.id)

  // Total views across all videos
  const { data: viewsData } = await supabase
    .from('videos')
    .select('views')
    .eq('channel_id', channel.id)

  const totalViews = (viewsData || []).reduce((sum: number, v: any) => sum + (v.views || 0), 0)

  // Total comments on creator's videos
  const { data: creatorVideos } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channel.id)

  const videoIds = (creatorVideos || []).map((v: any) => v.id)
  let totalComments = 0
  
  if (videoIds.length > 0) {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .in('video_id', videoIds)
    totalComments = count || 0
  }

  // Total likes on creator's videos
  let totalLikes = 0
  if (videoIds.length > 0) {
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .in('video_id', videoIds)
      .eq('type', 'like')
    totalLikes = count || 0
  }

  // Subscriber count from local subscriptions table
  const { count: localSubscribers } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channel.id)
    .eq('status', 'active')

  // --- Whop SDK Stats ---
  let whopMembershipCount = 0
  let estimatedRevenue = 0

  if (channel.whop_company_id) {
    try {
      // Fetch active memberships from Whop
      const memberships = await whop.memberships.list({
        company_id: channel.whop_company_id,
        statuses: ['active'],
      })
      whopMembershipCount = memberships.data.length

      // Calculate estimated revenue from membership tiers
      const { data: tiers } = await supabase
        .from('membership_tiers')
        .select('price, whop_plan_id')
        .eq('channel_id', channel.id)

      if (tiers && tiers.length > 0) {
        // Simple estimation: memberships * average tier price
        const avgPrice = tiers.reduce((sum: number, t: any) => sum + parseFloat(t.price), 0) / tiers.length
        estimatedRevenue = whopMembershipCount * avgPrice
      }
    } catch (err) {
      console.error('[Analytics] Whop SDK error:', err)
      // Fall back to local data
    }
  }

  // Use Whop membership count if available, otherwise local subscriber count
  const subscribers = whopMembershipCount || localSubscribers || 0

  // --- Recent Videos Performance ---
  const { data: recentVideos } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, views, created_at')
    .eq('channel_id', channel.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    stats: {
      totalViews,
      subscribers,
      estimatedRevenue: estimatedRevenue.toFixed(2),
      totalVideos: videoCount || 0,
      totalComments,
      totalLikes,
      whopMembershipCount,
    },
    recentVideos: recentVideos || [],
    channelName: channel.channel_name,
  })
}
