import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import { EmbeddedChat } from "@/components/EmbeddedChat";
import { CommentSection } from "@/components/CommentSection";
import { VideoLikeButtons } from "@/components/VideoLikeButtons";
import { CheckCircle, Share2, MoreHorizontal, Lock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { whop } from "@/lib/whop";

export default async function WatchPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = await createClient();
    const { id } = params;

    // Fetch video data
    const { data: video, error } = await supabase
        .from("videos")
        .select("*, channels(*, users(*))")
        .eq("id", id)
        .single();

    if (error || !video) {
        notFound();
    }

    // --- Membership Gating Logic ---
    let hasAccess = !video.is_gated;

    if (video.is_gated) {
        const session = await getSession();
        if (!session.isLoggedIn) {
            redirect("/signin");
        }

        try {
            const memberships = await whop.memberships.list({
                user_ids: [session.whopUserId!],
                company_id: video.channels.whop_company_id,
                statuses: ["active"],
            });
            hasAccess = memberships.data.length > 0;
        } catch (err) {
            console.error("Error checking membership:", err);
            hasAccess = false;
        }
    }

    // --- Fetch like/dislike counts ---
    const { data: videoLikes } = await supabase
        .from("video_likes")
        .select("type")
        .eq("video_id", id);

    const likeCount = (videoLikes || []).filter((l: any) => l.type === "like").length;
    const dislikeCount = (videoLikes || []).filter((l: any) => l.type === "dislike").length;

    // Check user's vote
    const session = await getSession();
    let userVote: string | null = null;
    if (session.isLoggedIn && session.userId) {
        const { data: userLike } = await supabase
            .from("video_likes")
            .select("type")
            .eq("user_id", session.userId)
            .eq("video_id", id)
            .single();
        userVote = userLike?.type || null;
    }

    // --- Subscriber count ---
    const { count: subscriberCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", video.channel_id)
        .eq("status", "active");

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
                {/* Video Player Area */}
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative group">
                    {hasAccess ? (
                        <video
                            src={video.video_url}
                            controls
                            className="w-full h-full"
                            poster={video.thumbnail_url}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[#0F0F0F] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-black/50 to-orange-900/20">
                            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 border border-orange-500/20">
                                <Lock className="w-10 h-10 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Members-only content</h2>
                            <p className="text-gray-400 max-w-md mb-8">
                                This video is exclusive to members of <span className="text-white font-bold">{video.channels.channel_name}</span>.
                                Join today to unlock this and all other premium content.
                            </p>
                            <a
                                href={`/channel/${video.channels.channel_name}`}
                                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-all transform hover:scale-105"
                            >
                                View Membership Tiers
                            </a>
                        </div>
                    )}
                </div>

                {/* Video Info */}
                <div className="space-y-4">
                    <h1 className="text-xl font-bold line-clamp-2">
                        {video.title}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#303030] overflow-hidden">
                                <img
                                    src={video.channels.users?.avatar_url || "/placeholder-avatar.jpg"}
                                    alt={video.channels.channel_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <h3 className="font-bold text-base leading-none">
                                        {video.channels.channel_name}
                                    </h3>
                                    <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-400">
                                    {subscriberCount || 0} subscribers
                                </p>
                            </div>
                            <button className="ml-4 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                                Subscribe
                            </button>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
                            <VideoLikeButtons
                                videoId={id}
                                initialLikeCount={likeCount}
                                initialDislikeCount={dislikeCount}
                                initialUserVote={userVote}
                            />
                            <button className="flex items-center gap-2 px-4 h-9 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-colors whitespace-nowrap">
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-bold">Share</span>
                            </button>
                            <button className="flex items-center justify-center w-9 h-9 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#272727] rounded-xl p-3 text-sm hover:bg-[#3f3f3f] transition-colors cursor-pointer group">
                        <div className="flex gap-2 font-bold mb-1">
                            <span>{video.views} views</span>
                            <span>2 days ago</span>
                        </div>
                        <p className="whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all">
                            {video.description || "No description provided."}
                        </p>
                    </div>

                    {/* Comments Section */}
                    <CommentSection videoId={id} />
                </div>
            </div>

            {/* Sidebar (Chat) */}
            <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0">
                <div className="sticky top-20">
                    <EmbeddedChat channelId={video.channels.whop_chat_channel_id || ""} />
                </div>
            </div>
        </div>
    );
}
