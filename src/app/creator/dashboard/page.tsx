import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import { getSession } from "@/lib/auth";
import { whop } from "@/lib/whop";
import { PlayCircle, Users, DollarSign, Film, MessageSquare, ThumbsUp } from "lucide-react";
import Link from "next/link";

export default async function CreatorDashboard() {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
        redirect("/api/auth/login");
    }

    const supabase = await createClient();

    // Fetch channel
    const { data: channel } = await supabase
        .from("channels")
        .select("*")
        .eq("id", session.userId)
        .single();

    if (!channel) {
        redirect("/creator/onboarding");
    }

    // --- Real Stats from Supabase ---

    // Total videos
    const { count: videoCount } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channel.id);

    // Total views
    const { data: viewsData } = await supabase
        .from("videos")
        .select("views")
        .eq("channel_id", channel.id);

    const totalViews = (viewsData || []).reduce((sum, v: any) => sum + (v.views || 0), 0);

    // Video IDs for comment/like queries
    const { data: creatorVideos } = await supabase
        .from("videos")
        .select("id")
        .eq("channel_id", channel.id);
    const videoIds = (creatorVideos || []).map((v: any) => v.id);

    let totalComments = 0;
    let totalLikes = 0;
    if (videoIds.length > 0) {
        const { count: commentCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .in("video_id", videoIds);
        totalComments = commentCount || 0;

        const { count: likeCount } = await supabase
            .from("video_likes")
            .select("*", { count: "exact", head: true })
            .in("video_id", videoIds)
            .eq("type", "like");
        totalLikes = likeCount || 0;
    }

    // Subscriber count (local)
    const { count: localSubscribers } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channel.id)
        .eq("status", "active");

    // --- Whop SDK: Active memberships & revenue ---
    let whopMembers = 0;
    let estimatedRevenue = 0;

    if (channel.whop_company_id) {
        try {
            const memberships = await whop.memberships.list({
                company_id: channel.whop_company_id,
                statuses: ["active"],
            });
            whopMembers = memberships.data.length;

            const { data: tiers } = await supabase
                .from("membership_tiers")
                .select("price")
                .eq("channel_id", channel.id);

            if (tiers && tiers.length > 0) {
                const avgPrice = tiers.reduce((s: number, t: any) => s + parseFloat(t.price), 0) / tiers.length;
                estimatedRevenue = whopMembers * avgPrice;
            }
        } catch (err) {
            console.error("[Dashboard] Whop error:", err);
        }
    }

    const subscribers = whopMembers || localSubscribers || 0;

    // Recent videos
    const { data: recentVideos } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, views, created_at")
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: false })
        .limit(5);

    function formatNumber(n: number): string {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    }

    const stats = [
        { label: "Total Views", value: formatNumber(totalViews), icon: PlayCircle, color: "text-blue-400" },
        { label: "Subscribers", value: formatNumber(subscribers), icon: Users, color: "text-purple-400" },
        { label: "Est. Revenue", value: `$${estimatedRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
        { label: "Videos", value: formatNumber(videoCount || 0), icon: Film, color: "text-orange-400" },
        { label: "Comments", value: formatNumber(totalComments), icon: MessageSquare, color: "text-cyan-400" },
        { label: "Likes", value: formatNumber(totalLikes), icon: ThumbsUp, color: "text-pink-400" },
    ];

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Channel Dashboard</h1>
                            <p className="text-gray-400 mt-1">Welcome back, {channel.channel_name}</p>
                        </div>
                        <Link
                            href="/creator/content"
                            className="bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors"
                        >
                            Upload Video
                        </Link>
                    </div>

                    {/* Whop Connection Status */}
                    {channel.whop_company_id ? (
                        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <p className="text-sm text-green-400">
                                <span className="font-semibold">Whop Connected</span> — Revenue and membership data synced live via Whop SDK
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <p className="text-sm text-yellow-400">
                                <span className="font-semibold">Whop not connected</span> — Connect your Whop company to enable revenue tracking
                            </p>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                        {stats.map((stat) => (
                            <div key={stat.label} className="p-5 bg-[#1F1F1F] border border-[#303030] rounded-2xl hover:border-[#404040] transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Recent Videos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl">
                                <h2 className="text-xl font-bold mb-4">Recent Videos</h2>
                                {recentVideos && recentVideos.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentVideos.map((v: any) => (
                                            <div key={v.id} className="flex gap-4 items-center p-3 hover:bg-[#272727] rounded-xl transition-colors">
                                                <div className="w-32 aspect-video bg-[#272727] rounded-lg overflow-hidden flex-shrink-0">
                                                    {v.thumbnail_url ? (
                                                        <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                            <Film className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-sm truncate">{v.title}</h3>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatNumber(v.views || 0)} views • {new Date(v.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm py-8 text-center">No videos yet. Upload your first video!</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-6">
                            <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl">
                                <h2 className="text-lg font-bold mb-4">Quick Links</h2>
                                <div className="space-y-3">
                                    <Link href="/creator/payouts" className="block p-3 rounded-xl hover:bg-[#272727] transition-colors border border-transparent hover:border-[#3f3f3f]">
                                        <p className="font-medium">Payout Portal</p>
                                        <p className="text-xs text-gray-400">View and withdraw earnings</p>
                                    </Link>
                                    <Link href="/creator/memberships" className="block p-3 rounded-xl hover:bg-[#272727] transition-colors border border-transparent hover:border-[#3f3f3f]">
                                        <p className="font-medium">Memberships</p>
                                        <p className="text-xs text-gray-400">Manage your subscription tiers</p>
                                    </Link>
                                    <Link href="/live" className="block p-3 rounded-xl hover:bg-[#272727] transition-colors border border-transparent hover:border-[#3f3f3f]">
                                        <p className="font-medium">Go Live</p>
                                        <p className="text-xs text-gray-400">Start a live stream</p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
